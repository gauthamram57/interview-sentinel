import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("interviewGuard", {
  joinSession: (sessionId) => ipcRenderer.invoke("join-session", sessionId),
  onConnected: (cb) => ipcRenderer.on("connected", (_e, data) => cb(data)),
  onDisconnected: (cb) => ipcRenderer.on("disconnected", (_e, data) => cb(data)),
  onScanResult: (cb) => ipcRenderer.on("scan-result", (_e, data) => cb(data)),
  onError: (cb) => ipcRenderer.on("error", (_e, data) => cb(data)),
});
