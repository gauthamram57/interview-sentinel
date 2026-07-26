import { clipboard } from "electron";

// Metadata only: clipboard length and how often it changes, never the
// text itself. This is a proxy signal — it detects that the system
// clipboard's content changed at some point during the interview (a copy
// happened somewhere), not that it was specifically pasted into whatever
// window the candidate is sharing. That distinction matters and belongs in
// how an interviewer reads this flag, not hidden from them.

let lastLength = null;
let changeCount = 0;

export function resetClipboardBaseline() {
  lastLength = safeLength();
  changeCount = 0;
}

/**
 * Call on the same cadence as the rest of the scan loop.
 * @returns {Array<{kind: string, detail: string}>}
 */
export function scanClipboard() {
  const currentLength = safeLength();
  if (lastLength === null) {
    lastLength = currentLength;
    return [];
  }
  if (currentLength === lastLength) return [];

  changeCount += 1;
  const delta = currentLength - lastLength;
  lastLength = currentLength;

  // Only flag substantive changes — a couple of characters is noise
  // (autocomplete, a stray click), not a signal worth an interviewer's time.
  if (Math.abs(delta) < 20) return [];

  return [{
    kind: "clipboard_change",
    detail: `Clipboard content changed to ${currentLength} characters (change #${changeCount} this session)`,
  }];
}

function safeLength() {
  try {
    return clipboard.readText().length;
  } catch {
    return 0;
  }
}
