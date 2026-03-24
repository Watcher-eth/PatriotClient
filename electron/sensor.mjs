import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { spawn } from "node:child_process"
import { homedir, hostname } from "node:os"
import { join } from "node:path"

const userDataDir = process.env.PATRIOT_DESKTOP_USER_DATA || join(homedir(), ".patriot", "desktop")
const sensorHome = join(userDataDir, "field-sensor")
const configPath = join(sensorHome, "config.json")

mkdirSync(sensorHome, { recursive: true })

let sensorState = {
  paired: false,
  workerId: null,
  controlPlaneUrl: null,
  capabilities: [],
  platform: detectPlatform(),
  nmapInstalled: false,
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

async function desktopCapabilities() {
  const nmapInstalled = await checkNmap()
  const capabilities = ["lan_access", "local_subnet_recon", "arp_neighbors", "bonjour_mdns_scan", "gateway_fingerprint"]
  if (nmapInstalled) capabilities.push("nmap_scan")
  sensorState = {
    ...sensorState,
    nmapInstalled,
    capabilities,
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
  await apiRequest(config.controlPlaneUrl, `/v1/workers/${config.workerId}/heartbeat`, { method: "POST" })
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
