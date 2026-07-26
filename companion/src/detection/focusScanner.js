import { windowManager } from "node-window-manager";

// Counts how many times the active window changes during the session.
// Deliberately not trying to guess "away from the interview" vs. "within
// it" — that inference is unreliable across different call setups (browser
// tab vs. native app, single vs. multi-window IDEs). Report the raw count
// with timestamps; let the interviewer read the pattern, consistent with
// the evidence-feed-not-a-verdict approach everywhere else in this app.

let switchCount = 0;
let lastOwner = null;
let listening = false;

export function startFocusTracking() {
  if (listening) return;
  listening = true;
  switchCount = 0;
  lastOwner = null;

  try {
    windowManager.on("window-activated", (win) => {
      const owner = safe(() => win.path) || safe(() => win.getTitle());
      if (owner && owner !== lastOwner) {
        switchCount += 1;
        lastOwner = owner;
      }
    });
  } catch (err) {
    console.error("focus tracking unavailable:", err.message);
    listening = false;
  }
}

/**
 * Call on the scan cadence. Only emits a flag at threshold points so the
 * evidence feed doesn't fill up with a line every single switch — 5, 15,
 * 30 — chosen as rough "worth a glance," "worth a question," "worth asking
 * about directly" markers rather than anything statistically derived.
 * @returns {Array<{kind: string, detail: string}>}
 */
const THRESHOLDS = [5, 15, 30];
const firedThresholds = new Set();

export function scanFocusSwitches() {
  const hit = THRESHOLDS.find((t) => switchCount >= t && !firedThresholds.has(t));
  if (!hit) return [];
  firedThresholds.add(hit);
  return [{
    kind: "focus_switches",
    detail: `Active window has changed ${switchCount} times this session`,
  }];
}

function safe(fn) {
  try {
    return fn();
  } catch {
    return null;
  }
}
