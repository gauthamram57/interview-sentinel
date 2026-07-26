// Reads kCGWindowSharingState for every window on the system — the same
// flag NSWindow.sharingType = .none sets on a window that wants to hide
// itself from screen capture. Node can't call CoreGraphics directly, so
// this compiles to a small standalone binary the Electron app shells out
// to on macOS (see ../nativeFlags.js).
//
// Build once:
//   swiftc main.swift -o mac-window-sharing
// then bundle the resulting `mac-window-sharing` binary as an extra
// resource in your electron-builder config (extraResources), since it
// needs to ship inside the app package, not be compiled on the user's
// machine.
//
// Note: kCGWindowSharingState reflects what the *window itself* declared,
// which is exactly the signal we want here (detection), even though as of
// macOS 15+ this same flag no longer actually stops ScreenCaptureKit from
// capturing the window — Apple confirmed that change is deliberate. We're
// reading the declaration, not relying on the enforcement.

import CoreGraphics
import Foundation

struct WindowInfo: Codable {
    let ownerName: String
    let windowName: String
    let pid: Int
    let sharingState: Int
    let isOnscreen: Bool
}

let options: CGWindowListOption = [.optionAll]
guard let windowList = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: AnyObject]] else {
    print("[]")
    exit(0)
}

var results: [WindowInfo] = []

for window in windowList {
    let ownerName = window[kCGWindowOwnerName as String] as? String ?? ""
    let windowName = window[kCGWindowName as String] as? String ?? ""
    let pid = window[kCGWindowOwnerPID as String] as? Int ?? 0
    let sharingState = window[kCGWindowSharingState as String] as? Int ?? 1
    let isOnscreen = window[kCGWindowIsOnscreen as String] as? Bool ?? false

    // kCGWindowSharingNone == 0: the window declared itself hidden from
    // capture/sharing. That declaration is the signal we care about.
    if sharingState == 0 {
        results.append(WindowInfo(
            ownerName: ownerName,
            windowName: windowName,
            pid: pid,
            sharingState: sharingState,
            isOnscreen: isOnscreen
        ))
    }
}

let encoder = JSONEncoder()
if let data = try? encoder.encode(results), let json = String(data: data, encoding: .utf8) {
    print(json)
} else {
    print("[]")
}
