import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { app } from "electron";
import { scanDisplayAffinity } from "./winDisplayAffinity.js";

const execFileAsync = promisify(execFile);

/**
 * Reads the OS's own "hide from capture" flag on every window. This is the
 * layer that generalizes beyond the name blocklist — it catches any tool
 * using the capture-exclusion trick, named or not.
 * @returns {Promise<Array<{kind: string, detail: string}>>}
 */
export async function scanNativeFlags() {
  if (process.platform === "win32") {
    try {
      return scanDisplayAffinity();
    } catch (err) {
      console.error("winDisplayAffinity scan failed:", err);
      return [];
    }
  }

  if (process.platform === "darwin") {
    return scanMacSharingState();
  }

  // Linux: no equivalent OS-level flag in common use for this yet — process
  // + window title matching (see processScanner.js / windowScanner.js) is
  // the primary layer there.
  return [];
}

async function scanMacSharingState() {
  const binaryPath = app.isPackaged
    ? path.join(process.resourcesPath, "mac-window-sharing")
    : path.join(app.getAppPath(), "src/detection/macWindowSharing/mac-window-sharing");

  try {
    const { stdout } = await execFileAsync(binaryPath, { timeout: 3000 });
    const windows = JSON.parse(stdout || "[]");

    return windows.map((w) => ({
      kind: "hidden_from_capture",
      detail: `Window "${w.windowName || "(untitled)"}" owned by "${w.ownerName}" (pid ${w.pid}) is excluded from screen sharing`,
    }));
  } catch (err) {
    // Most likely cause: the helper binary hasn't been compiled yet.
    // See macWindowSharing/main.swift for the one-time build step.
    console.error("mac-window-sharing helper failed or missing:", err.message);
    return [];
  }
}
