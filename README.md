# Interview Sentinel

<div align="center">

### Real-Time Interview Environment Verification Platform

Desktop companion and live interviewer dashboard for verifying interview session integrity through real-time security event monitoring.

> **Built with Electron • Node.js • WebSockets • Native OS APIs**

</div>

---

## Overview

Interview Sentinel is a desktop companion application and real-time interviewer dashboard designed to improve transparency during remote technical interviews.

Instead of recording a candidate's screen or making automated hiring decisions, Interview Sentinel continuously reports observable security events and environment verification signals to the interviewer.

The platform focuses on **environment verification**, **desktop integrity**, and **real-time telemetry**, allowing interviewers to make informed decisions based on transparent evidence rather than opaque automation.

---

# Features

- Desktop Companion Application
- Live Interviewer Dashboard
- Real-Time WebSocket Communication
- Interview Session Management
- Process Monitoring
- Window Enumeration
- Clipboard Activity Monitoring
- Window Focus Monitoring
- User Presence Detection
- Environment Verification
- Windows Display Affinity Detection
- macOS Window Sharing Detection
- Cross-Platform Architecture
- API Key & Session Authentication
- Stripe Billing Integration

---

# Architecture

<img width="1024" height="572" alt="image" src="https://github.com/user-attachments/assets/5d275b88-dc8f-4562-9af5-2fd91b53e887" />

---

# Repository Structure

```text
interview-sentinel/

├── companion/
│   Desktop companion application
│
├── dashboard/
│   Live interviewer dashboard
│
├── server/
│   Session management, APIs, billing, WebSockets
│
└── README.md
```

---

# Detection Capabilities

The current MVP continuously observes and reports security-related events during an interview session.

Current detection modules include:

- Process Monitoring
- Window Enumeration
- Hidden Window Detection
- Clipboard Metadata Monitoring
- Focus Change Monitoring
- User Presence Detection
- Environment Verification
- Windows Display Affinity Detection
- macOS Window Sharing Detection

The platform reports observable system events and does **not** attempt to infer candidate intent or make automated hiring decisions.

---

# Technology Stack

## Desktop

- Electron
- JavaScript
- Native Windows APIs
- Native macOS APIs

## Backend

- Node.js
- Express
- WebSockets

## Frontend

- HTML
- JavaScript

## Billing

- Stripe

---

# Running Locally

## Server

```bash
cd server
npm install
npm start
```

Server runs on

```
http://localhost:4000
```

---

## Dashboard

Open

```
dashboard/index.html
```

or serve it using any static web server.

---

## Companion

```bash
cd companion
npm install
npm start
```

---

# Packaging

Electron Builder is configured for:

- Windows Installer (.exe)
- macOS (.dmg)

Production releases are generated through GitHub Actions using signed builds and platform-specific code signing.

---

# Current Status

Current implementation includes:

- Live session management
- Desktop companion
- Dashboard interface
- WebSocket communication
- Process monitoring
- Window monitoring
- Environment verification
- Native platform detection
- Billing integration

---

# Roadmap

Planned improvements include:

- Binary Integrity Verification
- Companion Tamper Detection
- Secure Heartbeat Protocol
- Linux Support
- Enterprise Authentication
- Organization Management
- Audit Reports
- ATS Integrations
- Public API
- Risk Analytics Dashboard

---

# Privacy

Interview Sentinel is designed around transparency.

The platform reports observable system events required for interview environment verification.

It is **not** designed to:

- Record screen contents
- Record keystrokes
- Read personal files
- Capture browser history
- Access private documents

Organizations using Interview Sentinel should clearly communicate what information is collected and obtain appropriate user consent before monitoring begins.

---

# Disclaimer

Interview Sentinel is an interview environment verification platform.

It provides visibility into observable security events and desktop environment status during an interview session.

The platform is intended to assist interviewers and should **not** be used as the sole basis for employment decisions.

---

# License

This repository is provided for educational and research purposes.

Commercial use may require additional licensing.

---

## Author

Developed as a security engineering project exploring desktop integrity verification, system telemetry, and interview environment monitoring using Electron and native operating system APIs.
