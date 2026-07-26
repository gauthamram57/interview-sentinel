// Windows-only. Reads the same flag Cluely-style overlays set on themselves
// to hide from screen share: WDA_EXCLUDEFROMCAPTURE via
// GetWindowDisplayAffinity. This is the mechanism a Microsoft engineer
// pointed at directly when asked how to catch this exact trick in an exam
// context: enumerate top-level windows, call GetWindowDisplayAffinity on
// each, flag anything with WDA_EXCLUDEFROMCAPTURE or WDA_MONITOR set.
//
// NOTE: written against koffi's documented FFI patterns and the Win32 API
// as documented by Microsoft. This repo was built in a Linux sandbox with
// no Windows machine available to runtime-test the FFI calls — treat this
// as a strong starting point, not a verified-working drop-in. Sanity-check
// the exact `func()` signatures against whatever koffi version you install;
// its calling-convention/string-marshalling syntax has shifted across
// versions.

import koffi from "koffi";

const WDA_NONE = 0x00;
const WDA_MONITOR = 0x01;
const WDA_EXCLUDEFROMCAPTURE = 0x11;

let user32;
let EnumWindows, GetWindowDisplayAffinity, GetWindowThreadProcessId, IsWindowVisible, GetWindowTextW, GetWindowTextLengthW;

function init() {
  if (user32) return;
  user32 = koffi.load("user32.dll");

  koffi.proto("EnumWindowsProc", "int32", ["void *", "intptr_t"]);

  EnumWindows = user32.func("int32 __stdcall EnumWindows(EnumWindowsProc *, intptr_t)");
  GetWindowDisplayAffinity = user32.func(
    "int32 __stdcall GetWindowDisplayAffinity(void *, _Out_ uint32 *)"
  );
  GetWindowThreadProcessId = user32.func(
    "uint32 __stdcall GetWindowThreadProcessId(void *, _Out_ uint32 *)"
  );
  IsWindowVisible = user32.func("int32 __stdcall IsWindowVisible(void *)");
  GetWindowTextLengthW = user32.func("int32 __stdcall GetWindowTextLengthW(void *)");
  GetWindowTextW = user32.func("int32 __stdcall GetWindowTextW(void *, _Out_ str16, int32)");
}

/**
 * @returns {Array<{kind: string, detail: string}>}
 */
export function scanDisplayAffinity() {
  if (process.platform !== "win32") return [];
  init();

  const flags = [];
  const hwnds = [];

  const callback = koffi.register((hwnd) => {
    hwnds.push(hwnd);
    return 1; // continue enumeration
  }, koffi.pointer("EnumWindowsProc"));

  try {
    EnumWindows(callback, 0);
  } finally {
    koffi.unregister(callback);
  }

  for (const hwnd of hwnds) {
    if (!IsWindowVisible(hwnd)) continue;

    const affinityOut = [0];
    const ok = GetWindowDisplayAffinity(hwnd, affinityOut);
    if (!ok) continue;

    const affinity = affinityOut[0];
    if (affinity === WDA_NONE) continue;

    const len = GetWindowTextLengthW(hwnd);
    let title = "";
    if (len > 0) {
      const buf = Buffer.alloc((len + 1) * 2);
      GetWindowTextW(hwnd, buf, len + 1);
      title = buf.toString("utf16le").replace(/\0+$/, "");
    }

    const pidOut = [0];
    GetWindowThreadProcessId(hwnd, pidOut);

    flags.push({
      kind: "hidden_from_capture",
      detail:
        affinity === WDA_EXCLUDEFROMCAPTURE
          ? `Window "${title || "(untitled)"}" (pid ${pidOut[0]}) is fully excluded from screen capture`
          : `Window "${title || "(untitled)"}" (pid ${pidOut[0]}) is set to hide from remote monitors`,
    });
  }

  return flags;
}
