import { windowManager } from "node-window-manager";
import { matchesBlocklist } from "./blocklist.js";

/**
 * Scans open window titles for known cheating-tool signatures.
 * Note: on macOS this requires Accessibility permission for the app, which
 * the candidate will be prompted for on first run — that prompt itself is
 * part of the disclosure, since it names the app requesting it.
 * @returns {Array<{kind: string, detail: string}>}
 */
export function scanWindows() {
  const flags = [];
  let windows = [];

  try {
    windows = windowManager.getWindows();
  } catch (err) {
    // Permission not yet granted, or unsupported platform — fail open here;
    // nativeFlags.js's OS-level check doesn't depend on this permission.
    return flags;
  }

  for (const win of windows) {
    const title = safe(() => win.getTitle());
    const match = matchesBlocklist(title);
    if (match) {
      flags.push({
        kind: match.kind,
        detail: `Window titled "${title}" matches "${match.match}"`,
      });
    }
  }

  return flags;
}

function safe(fn) {
  try {
    return fn();
  } catch {
    return "";
  }
}
