// Substrings matched case-insensitively against process names/cmd and
// window titles/owner names. Split into categories because each one means
// something different in the evidence feed — an AI overlay tool and a
// remote-desktop app are not the same signal, and the dashboard should say
// so rather than lump everything into one generic "flagged."
//
// This blocklist is the weakest layer on its own (renamed builds slip
// through) which is exactly why it's paired with the OS-level
// capture-exclusion-flag check in nativeFlags.js.

const CATEGORIES = {
  ai_cheating_tool: [
    // Publicly reported "AI interview assistant" overlay tools as of
    // mid-2026 (Cluely, Interview Coder, LockedIn AI, Parakeet AI, Final
    // Round AI, Sensei AI, and their common rebrands).
    "cluely",
    "interview coder",
    "interviewcoder",
    "lockedin",
    "locked in ai",
    "parakeet ai",
    "parakeetai",
    "final round ai",
    "finalround",
    "sensei ai",
    "senseicopilot",
    "leetcode wizard",
  ],
  remote_desktop: [
    // The real mechanism behind "someone else is solving it remotely."
    "teamviewer",
    "anydesk",
    "chrome remote desktop",
    "quickassist",
    "quick assist",
    "vnc",
    "supremo",
    "aeroadmin",
  ],
  virtual_audio: [
    // Routing tools that let a second audio source (a "whisperer," another
    // device) feed into what the interview call hears. Detects the driver,
    // never the audio content.
    "vb-audio",
    "vb-cable",
    "blackhole",
    "voicemeeter",
    "soundflower",
  ],
  virtual_camera: [
    // Standard tooling for feeding a pre-recorded loop or a face swap into
    // a video call. Detects the driver's presence, never what's playing
    // through it.
    "obs virtual camera",
    "manycam",
    "snap camera",
    "xsplit vcam",
    "nvidia broadcast",
  ],
};

export function matchesBlocklist(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [kind, signatures] of Object.entries(CATEGORIES)) {
    const match = signatures.find((sig) => lower.includes(sig));
    if (match) return { kind, match };
  }
  return null;
}
