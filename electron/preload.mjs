import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("patriotDesktop", {
  isDesktopShell: true,
  getSensorState: () => ipcRenderer.invoke("patriot-desktop:get-sensor-state"),
  pairWithToken: (payload) => ipcRenderer.invoke("patriot-desktop:pair", payload),
  openExternal: (url) => ipcRenderer.invoke("patriot-desktop:open-external", url),
  onSensorState: (callback) => {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on("patriot-desktop:sensor-state", handler)
    return () => {
      ipcRenderer.removeListener("patriot-desktop:sensor-state", handler)
    }
  },
})
