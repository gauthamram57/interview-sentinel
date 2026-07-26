import psList from "ps-list";

// The inverse of the blocklist: instead of flagging bad processes, this
// checks that an *expected* one is present. A companion app running with
// no video client active alongside it means it's very likely sitting on a
// second, decoy machine while the real interview happens elsewhere — the
// main threat this check is built to catch.

const VIDEO_CLIENT_SIGNATURES = [
  "zoom.us", "zoom.exe",
  "teams.exe", "ms-teams",
  "chrome", "msedge", "firefox", // proxy for browser-based Meet/Zoom Web — imperfect but cheap
];

/**
 * @returns {Promise<{present: boolean, flags: Array<{kind: string, detail: string}>}>}
 */
export async function scanPresence() {
  const processes = await psList();
  const names = processes.map((p) => (p.name || "").toLowerCase());
  const present = VIDEO_CLIENT_SIGNATURES.some((sig) =>
    names.some((name) => name.includes(sig))
  );

  if (present) return { present: true, flags: [] };

  return {
    present: false,
    flags: [{
      kind: "no_video_client_detected",
      detail: "Monitoring is active but no known video-calling application was detected on this machine",
    }],
  };
}
