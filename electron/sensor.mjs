import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { spawn } from "node:child_process"
import { homedir, hostname } from "node:os"
import { join } from "node:path"

const userDataDir = process.env.PATRIOT_DESKTOP_USER_DATA || join(homedir(), ".patriot", "desktop")
const sensorHome = join(userDataDir, "field-sensor")
const configPath = join(sensorHome, "config.json")
const fieldWorkerVersion = "1.1.0"

mkdirSync(sensorHome, { recursive: true })

let sensorState = {
  paired: false,
  workerId: null,
  controlPlaneUrl: null,
  capabilities: [],
  platform: detectPlatform(),
  nmapInstalled: false,
  adapter: null,
  capabilityInventory: [],
  toolInventory: [],
  lastHeartbeatAt: null,
  status: "idle",
  error: null,
}

let heartbeatTimer = null
let jobLoopActive = false

function detectPlatform() {
  switch (process.platform) {
    case "darwin":
      return "macos"
    case "win32":
      return "windows"
    default:
      return "linux"
  }
}

function hasConfig() {
  return existsSync(configPath)
}

function readConfig() {
  return JSON.parse(readFileSync(configPath, "utf8"))
}

function writeConfig(config) {
  writeFileSync(configPath, JSON.stringify(config, null, 2))
}

function sendState() {
  if (typeof process.send === "function") {
    process.send({ type: "state", payload: sensorState })
  }
}

function runCommand(bin, args) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"], shell: false })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })
    child.on("error", (error) => resolve({ ok: false, stdout, stderr: `${stderr}${String(error)}` }))
    child.on("close", (code) => resolve({ ok: code === 0, stdout, stderr, exitCode: code }))
  })
}

async function checkNmap() {
  const lookup = process.platform === "win32" ? ["where", ["nmap"]] : ["which", ["nmap"]]
  const result = await runCommand(lookup[0], lookup[1])
  return Boolean(result.ok)
}

async function checkTool(tool) {
  const lookup =
    process.platform === "win32"
      ? ["where", [tool]]
      : ["/bin/sh", ["-lc", `command -v ${tool}`]]
  const result = await runCommand(lookup[0], lookup[1])
  if (!result.ok || !String(result.stdout).trim()) {
    return {
      tool,
      state: "missing",
      missingDependencies: [tool],
      evidence: [result.stderr || `${tool} is not on PATH`],
    }
  }
  return {
    tool,
    state: "available",
    bin: String(result.stdout).split("\n")[0]?.trim() || tool,
    evidence: [`resolved ${tool} on PATH`, `PATH=${process.env.PATH ?? ""}`],
  }
}

function macDesktopDiagnostics(toolInventory) {
  const pathValue = process.env.PATH ?? ""
  const diagnostics = []
  const recommendedFixes = []

  if (!pathValue.includes("/opt/homebrew/bin") && !pathValue.includes("/usr/local/bin")) {
    diagnostics.push("macOS desktop PATH is missing /opt/homebrew/bin and /usr/local/bin")
    recommendedFixes.push("Restart Patriot Desktop from the installed app or expose Homebrew bins in the launch environment.")
  }
  if (!toolInventory.find((entry) => entry.tool === "nmap" && entry.state === "available")) {
    diagnostics.push("nmap is unavailable for active LAN enrichment")
    recommendedFixes.push("Install nmap with Homebrew and restart Patriot Desktop.")
  }

  return { diagnostics, recommendedFixes }
}

async function desktopCapabilities() {
  const toolNames = process.platform === "win32" ? ["powershell", "nmap", "arp"] : ["nmap", "arp", "dns-sd", "route"]
  const toolInventory = await Promise.all(toolNames.map((tool) => checkTool(tool)))
  const toolState = new Map(toolInventory.map((entry) => [entry.tool, entry.state]))
  const capabilityInventory = [
    {
      capability: "lan_access",
      state: "detected",
      evidence: ["desktop runtime available"],
      collectionModes: ["passive"],
    },
    {
      capability: "local_subnet_recon",
      state: process.platform === "win32" ? "available" : toolState.get("route") === "available" ? "available" : "degraded",
      missingDependencies: process.platform === "win32" || toolState.get("route") === "available" ? [] : ["route"],
      evidence: [process.platform === "win32" ? "PowerShell network commands available" : "requires route"],
      collectionModes: ["passive"],
    },
    {
      capability: "arp_neighbors",
      state: toolState.get("arp") === "available" ? "available" : "degraded",
      missingDependencies: toolState.get("arp") === "available" ? [] : ["arp"],
      evidence: ["requires arp"],
      collectionModes: ["passive"],
    },
    {
      capability: "bonjour_mdns_scan",
      state:
        process.platform === "win32"
          ? "available"
          : toolState.get("dns-sd") === "available"
            ? "available"
            : "degraded",
      missingDependencies:
        process.platform === "win32" || toolState.get("dns-sd") === "available" ? [] : ["dns-sd"],
      evidence: [process.platform === "win32" ? "PowerShell resolver path" : "requires dns-sd"],
      collectionModes: ["passive"],
    },
    {
      capability: "gateway_fingerprint",
      state: process.platform === "win32" ? "available" : toolState.get("route") === "available" ? "available" : "degraded",
      missingDependencies: process.platform === "win32" || toolState.get("route") === "available" ? [] : ["route"],
      evidence: [process.platform === "win32" ? "PowerShell route inspection" : "requires route"],
      collectionModes: ["passive"],
    },
    {
      capability: "nmap_scan",
      state: toolState.get("nmap") === "available" ? "available" : "degraded",
      missingDependencies: toolState.get("nmap") === "available" ? [] : ["nmap"],
      evidence: ["requires nmap"],
      collectionModes: ["active"],
    },
  ]
  const capabilities = capabilityInventory
    .filter((entry) => entry.state === "available" || entry.state === "detected")
    .map((entry) => entry.capability)
  const macDiagnostics = process.platform === "darwin" ? macDesktopDiagnostics(toolInventory) : { diagnostics: [], recommendedFixes: [] }

  sensorState = {
    ...sensorState,
    nmapInstalled: toolState.get("nmap") === "available",
    capabilities,
    capabilityInventory,
    toolInventory,
    adapter: {
      id: `desktop-${detectPlatform()}`,
      kind: "desktop",
      version: fieldWorkerVersion,
      platformFamily: "desktop",
      setupMethods: ["native_pairing", "deep_link", "installer", "script"],
      health: toolInventory.some((entry) => entry.state !== "available") ? "degraded" : "healthy",
      approvalMode: "per_adapter",
      supportedEvidenceFamilies: ["local_network", "host_presence", "service", "context"],
      diagnostics: [
        ...macDiagnostics.diagnostics,
        ...toolInventory.filter((entry) => entry.state !== "available").map((entry) => `${entry.tool}: ${entry.state}`),
      ],
      recommendedFixes: [
        ...macDiagnostics.recommendedFixes,
        ...toolInventory.filter((entry) => entry.state === "missing").map((entry) => `Install or expose ${entry.tool} on PATH.`),
      ],
    },
  }
  return capabilities
}

async function apiRequest(baseUrl, path, init = {}) {
  const response = await fetch(`${String(baseUrl).replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${response.status} ${response.statusText}: ${text}`)
  }

  if (response.status === 204) return null
  return response.json()
}

async function heartbeat() {
  const config = readConfig()
  await desktopCapabilities()
  await apiRequest(config.controlPlaneUrl, `/v1/workers/${config.workerId}/heartbeat`, {
    method: "POST",
    body: JSON.stringify({
      capabilities: sensorState.capabilities,
      adapter: sensorState.adapter,
      capabilityInventory: sensorState.capabilityInventory,
      toolInventory: sensorState.toolInventory,
    }),
  })
  sensorState = {
    ...sensorState,
    paired: true,
    workerId: config.workerId,
    controlPlaneUrl: config.controlPlaneUrl,
    lastHeartbeatAt: new Date().toISOString(),
    status: "online",
    error: null,
  }
  sendState()
}

async function claimJob() {
  const config = readConfig()
  return apiRequest(config.controlPlaneUrl, "/v1/field-sensors/jobs/claim", {
    method: "POST",
    body: JSON.stringify({ workerId: config.workerId }),
  })
}

async function completeJob(jobId, body) {
  const config = readConfig()
  await apiRequest(config.controlPlaneUrl, `/v1/field-sensors/jobs/${jobId}/complete`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

async function execJob(job) {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const child = spawn(job.bin, job.args, {
      cwd: job.cwd,
      env: {
        ...process.env,
        ...(job.env ?? {}),
      },
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    })

    let stdout = ""
    let stderr = ""
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill("SIGKILL")
      } catch {}
    }, job.timeoutMs)

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })
    child.on("error", (error) => {
      clearTimeout(timer)
      resolve({
        ok: false,
        error: String(error),
        result: {
          ok: false,
          bin: job.bin,
          args: job.args,
          exitCode: null,
          stdout: stdout.trim(),
          stderr: `${stderr}${String(error)}`.trim(),
          startedAt,
          endedAt: Date.now(),
          timedOut: false,
        },
      })
    })
    child.on("close", (exitCode) => {
      clearTimeout(timer)
      resolve({
        ok: exitCode === 0 && !timedOut,
        result: {
          ok: exitCode === 0 && !timedOut,
          bin: job.bin,
          args: job.args,
          exitCode,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          startedAt,
          endedAt: Date.now(),
          timedOut,
        },
      })
    })
  })
}

async function ensurePairedLoop() {
  if (jobLoopActive || !hasConfig()) return
  jobLoopActive = true
  for (;;) {
    if (!hasConfig()) {
      jobLoopActive = false
      return
    }
    try {
      const job = await claimJob()
      if (!job) {
        await new Promise((resolve) => setTimeout(resolve, 2500))
        continue
      }
      sensorState = {
        ...sensorState,
        status: "running-job",
      }
      sendState()
      const result = await execJob(job)
      await completeJob(job.id, result)
      sensorState = {
        ...sensorState,
        status: "online",
      }
      sendState()
    } catch (error) {
      sensorState = {
        ...sensorState,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      }
      sendState()
      await new Promise((resolve) => setTimeout(resolve, 2500))
    }
  }
}

async function pair({ token, baseUrl, name }) {
  const capabilities = await desktopCapabilities()
  const payload = await apiRequest(baseUrl, "/v1/field-sensors/enroll", {
    method: "POST",
    body: JSON.stringify({
      token,
      name: name || hostname(),
      platform: detectPlatform(),
      capabilities,
      adapter: sensorState.adapter,
      capabilityInventory: sensorState.capabilityInventory,
      toolInventory: sensorState.toolInventory,
    }),
  })

  const config = {
    workerId: payload.worker.id,
    controlPlaneUrl: String(baseUrl).replace(/\/$/, ""),
    heartbeatMs: payload.heartbeatMs ?? 30000,
  }
  writeConfig(config)

  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(() => {
    void heartbeat().catch((error) => {
      sensorState = {
        ...sensorState,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      }
      sendState()
    })
  }, config.heartbeatMs)

  await heartbeat()
  void ensurePairedLoop()
}

process.on("message", async (message) => {
  if (!message || typeof message !== "object") return
  if (message.type === "pair") {
    try {
      await pair(message.payload)
    } catch (error) {
      sensorState = {
        ...sensorState,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      }
      sendState()
    }
  }
  if (message.type === "get-state") {
    if (hasConfig()) {
      const config = readConfig()
      sensorState = {
        ...sensorState,
        paired: true,
        workerId: config.workerId,
        controlPlaneUrl: config.controlPlaneUrl,
      }
      await desktopCapabilities()
    }
    sendState()
  }
})

if (hasConfig()) {
  const config = readConfig()
  sensorState = {
    ...sensorState,
    paired: true,
    workerId: config.workerId,
    controlPlaneUrl: config.controlPlaneUrl,
  }
  void desktopCapabilities().then(() => {
    heartbeatTimer = setInterval(() => {
      void heartbeat().catch((error) => {
        sensorState = {
          ...sensorState,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }
        sendState()
      })
    }, config.heartbeatMs ?? 30000)
    void heartbeat()
    void ensurePairedLoop()
  })
}

sendState()
