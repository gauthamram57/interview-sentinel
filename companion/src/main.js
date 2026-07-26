import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";
import { scanProcesses } from "./detection/processScanner.js";
import { scanWindows } from "./detection/windowScanner.js";
import { scanNativeFlags } from "./detection/nativeFlags.js";
import { scanMonitors, scanVirtualMachine } from "./detection/environmentScanner.js";
import { resetClipboardBaseline, scanClipboard } from "./detection/clipboardScanner.js";
import { startFocusTracking, scanFocusSwitches } from "./detection/focusScanner.js";
import { scanPresence } from "./detection/presenceScanner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WS_BASE = process.env.INTERVIEW_GUARD_WS || "ws://localhost:4000";
const SCAN_INTERVAL_MS = 4000;

let mainWindow;
let socket = null;
let scanTimer = null;

// --- window ---------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 220,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
}

// --- deep link handling (interviewguard://join/<sessionId>) ---------

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("interviewguard", process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient("interviewguard");
}

function extractSessionId(url) {
  // interviewguard://join/<sessionId>
  const match = /interviewguard:\/\/join\/([\w-]+)/.exec(url || "");
  return match ? match[1] : null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const url = argv.find((a) => a.startsWith("interviewguard://"));
    const sessionId = extractSessionId(url);
    if (sessionId) connectSession(sessionId);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("open-url", (event, url) => {
    event.preventDefault();
    const sessionId = extractSessionId(url);
    if (sessionId) connectSession(sessionId);
  });

  app.whenReady().then(() => {
    createWindow();

    // Support "paste code manually" fallback from the renderer.
    ipcMain.handle("join-session", (_event, sessionId) => connectSession(sessionId));

    const startupUrl = process.argv.find((a) => a.startsWith("interviewguard://"));
    const sessionId = extractSessionId(startupUrl);
    if (sessionId) connectSession(sessionId);
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- session connection + detection loop -----------------------------

async function connectSession(sessionId) {
  if (socket) socket.close();
  if (scanTimer) clearInterval(scanTimer);

  // One-time, session-start checks: the machine's VM status doesn't change
  // mid-session, and the clipboard/focus trackers need a clean baseline
  // before the recurring scan loop starts comparing against it.
  resetClipboardBaseline();
  startFocusTracking();
  const startupFlags = await scanVirtualMachine();

  socket = new WebSocket(`${WS_BASE}/ws?sessionId=${sessionId}&role=candidate`);

  socket.on("open", () => {
    send("connected", { sessionId });
    scanTimer = setInterval(runScan, SCAN_INTERVAL_MS);
    runScan(startupFlags); // immediate first scan, includes the one-time checks
  });

  socket.on("close", () => {
    send("disconnected", {});
    if (scanTimer) clearInterval(scanTimer);
  });

  socket.on("error", (err) => {
    send("error", { message: err.message });
  });
}

async function runScan(startupFlags = []) {
  const [processFlags, nativeFlags, presence] = await Promise.all([
    scanProcesses(),
    scanNativeFlags(),
    scanPresence(),
  ]);
  // Sync, cheap checks — no need for Promise.all overhead.
  const windowFlags = scanWindows();
  const monitorFlags = scanMonitors();
  const clipboardFlags = scanClipboard();
  const focusFlags = scanFocusSwitches();

  const allFlags = [
    ...startupFlags,
    ...processFlags,
    ...windowFlags,
    ...nativeFlags,
    ...presence.flags,
    ...monitorFlags,
    ...clipboardFlags,
    ...focusFlags,
  ];
  const status = allFlags.length > 0 ? "flagged" : "clear";

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "status", status, flags: allFlags }));
  }

  send("scan-result", { status, flags: allFlags });
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}
