# Server

Backend server for **Interview Sentinel**.

The server manages interview sessions, authenticates clients, processes telemetry from the desktop companion, and distributes live events to connected interviewer dashboards.

It serves as the central communication hub of the Interview Sentinel platform.

---

## Features

- REST API
- WebSocket server
- Session management
- Companion authentication
- Dashboard authentication
- API key management
- Billing integration
- Real-time event routing

---

## Directory Structure

```text
server/

├── package.json
├── package-lock.json
└── src/
    ├── index.js
    ├── sessions.js
    ├── accounts.js
    └── billing.js
```

---

## Architecture

```
Desktop Companion
        │
        ▼
 REST + WebSockets
        │
        ▼
 Interview Server
        │
        ▼
 Interview Dashboard
```

---

## Modules

### index.js

Application entry point.

Responsible for:

- Starting the server
- Initializing APIs
- Creating WebSocket connections
- Registering routes

---

### sessions.js

Manages interview sessions.

Responsibilities include:

- Session creation
- Session validation
- Session lifecycle
- Connected clients

---

### accounts.js

Handles:

- Organization accounts
- API key validation
- Authentication
- Access control

---

### billing.js

Responsible for:

- Stripe integration
- Subscription management
- Usage validation
- Billing events

---

## Installation

```bash
npm install
```

---

## Running

```bash
npm start
```

The server starts on

```
http://localhost:4000
```

---

## API Responsibilities

The backend coordinates communication between:

- Desktop companion
- Interview dashboard
- Organization accounts
- Billing services

---

## Technologies

- Node.js
- Express
- WebSockets
- Stripe

---

## Security

The server validates incoming requests before accepting interview telemetry.

Current security mechanisms include:

- API key authentication
- Session validation
- WebSocket connection management
- Organization isolation

Additional hardening such as rate limiting, audit logging, encrypted telemetry, and enhanced authentication is planned for future releases.

---

## Status

The current implementation supports the core backend services required for Interview Sentinel, including session management, real-time communication, authentication, and billing integration. Future releases will focus on scalability, enterprise features, and additional security controls.
