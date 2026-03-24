import { app, BrowserWindow, ipcMain, shell } from "electron"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const sensorEntry = join(__dirname, "sensor.mjs")

let mainWindow = null
let sensorProcess = null
let sensorState = {
  paired: false,
  status: "idle",
  capabilities: [],
  nmapInstalled: false,
  error: null,
}

function startUrl() {
  return process.env.PATRIOT_DESKTOP_START_URL || process.env.NEXT_PUBLIC_PATRIOT_SITE_URL || "http://127.0.0.1:3000"
}

function broadcastSensorState() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("patriot-desktop:sensor-state", sensorState)
  }
}

function ensureSensorProcess() {
  if (sensorProcess) return sensorProcess
  sensorProcess = spawn(process.execPath, [sensorEntry], {
    env: {
      ...process.env,
      PATRIOT_DESKTOP_USER_DATA: app.getPath("userData"),
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  })

  sensorProcess.on("message", (message) => {
    if (message?.type === "state") {
      sensorState = {
        ...sensorState,
        ...message.payload,
      }
      broadcastSensorState()
    }
  })

  sensorProcess.stdout?.on("data", (chunk) => {
    console.log(`[patriot-desktop:sensor] ${chunk.toString().trim()}`)
  })
  sensorProcess.stderr?.on("data", (chunk) => {
    console.error(`[patriot-desktop:sensor] ${chunk.toString().trim()}`)
  })
  sensorProcess.on("exit", () => {
    sensorProcess = null
  })

  sensorProcess.send?.({ type: "get-state" })
  return sensorProcess
}

function sendPairingPayload(rawUrl) {
  try {
    const parsed = new URL(rawUrl)
    const token = parsed.searchParams.get("token")
    const baseUrl = parsed.searchParams.get("baseUrl")
    if (!token || !baseUrl) return
    ensureSensorProcess().send?.({
      type: "pair",
      payload: {
        token,
        baseUrl,
      },
    })
  } catch (error) {
    console.error("[patriot-desktop] failed to parse pairing url", error)
  }
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#101010",
    webPreferences: {
      preload: join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  await mainWindow.loadURL(startUrl())
  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.on("open-url", (event, url) => {
  event.preventDefault()
  sendPairingPayload(url)
})

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on("second-instance", (_event, commandLine) => {
    const pairingArg = commandLine.find((arg) => arg.startsWith("patriot-desktop://"))
    if (pairingArg) sendPairingPayload(pairingArg)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(async () => {
  app.setAsDefaultProtocolClient("patriot-desktop")
  ensureSensorProcess()
  await createMainWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

app.on("activate", async () => {
  if (!BrowserWindow.getAllWindows().length) {
    await createMainWindow()
  }
})

ipcMain.handle("patriot-desktop:get-sensor-state", async () => {
  ensureSensorProcess().send?.({ type: "get-state" })
  return sensorState
})

ipcMain.handle("patriot-desktop:pair", async (_event, payload) => {
  ensureSensorProcess().send?.({ type: "pair", payload })
  return { ok: true }
})

ipcMain.handle("patriot-desktop:open-external", async (_event, targetUrl) => {
  await shell.openExternal(targetUrl)
  return { ok: true }
})
