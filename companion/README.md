# Companion

Desktop companion application for **Interview Sentinel**.

The companion runs on the candidate's computer during an interview session and continuously collects **environment verification signals**. These signals are securely transmitted to the Interview Sentinel backend, allowing interviewers to observe relevant desktop events in real time.

The application is designed to provide transparency into the interview environment while avoiding invasive monitoring techniques.

---

## Features

- Desktop companion built with Electron
- Real-time WebSocket communication
- Process monitoring
- Window enumeration
- Clipboard activity monitoring
- Window focus detection
- User presence detection
- Environment verification
- Native Windows API integration
- Native macOS API integration
- Cross-platform architecture

---

## Directory Structure

```text
companion/

├── package.json
└── src/
    ├── main.js
    ├── preload.js
    ├── renderer/
    └── detection/
```

---

## Detection Modules

### Process Scanner

Detects running applications that may violate interview policies.

---

### Window Scanner

Enumerates visible desktop windows and reports metadata to the backend.

---

### Clipboard Scanner

Detects clipboard activity during an interview session.

---

### Focus Scanner

Monitors whether the interview application remains in focus.

---

### Presence Scanner

Checks user activity and system presence.

---

### Environment Scanner

Collects operating system and runtime information required for environment verification.

---

### Native Platform Detection

Platform-specific detection modules provide additional verification capabilities.

**Windows**

- Display Affinity detection
- Native flag inspection

**macOS**

- Window sharing detection using native Swift components

---

## Communication

```
Electron Companion
        │
        ▼
WebSocket Connection
        │
        ▼
Interview Sentinel Server
```

---

## Running

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm start
```

---

## Technologies

- Electron
- Node.js
- JavaScript
- Native Windows APIs
- Native macOS APIs
- WebSockets

---

## Security

The companion reports observable system events required for interview environment verification.

The application is **not intended to**:

- Record screen contents
- Capture keystrokes
- Access personal files
- Read browser history
- Inspect private document contents

Organizations deploying the companion should obtain appropriate user consent before monitoring begins.

---

## Status

Current implementation includes the core desktop monitoring engine and platform-specific detection modules. Additional detection capabilities, security hardening, and enterprise management features are planned for future releases.
