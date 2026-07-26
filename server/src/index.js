import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { nanoid } from "nanoid";
import { createSession, getSession, allSessions } from "./sessions.js";
import { getAccount, consumeCredit } from "./accounts.js";
import { billingRouter, handleStripeWebhook, checkoutSuccessHandler } from "./billing.js";

const PORT = process.env.PORT || 4000;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

const app = express();
app.use(cors());

// Stripe webhook needs the raw body for signature verification, so it must
// be registered BEFORE express.json() runs on the request.
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(express.json());
app.use("/api", billingRouter);
app.get("/checkout/success", checkoutSuccessHandler);
app.get("/checkout/cancelled", (_req, res) => res.send("Checkout cancelled — no charge made."));

// --- REST API ---------------------------------------------------------

// Interviewer clicks "create interview" -> get a candidate link + short code.
// Requires a paid API key with at least one credit remaining (see billing.js
// for how credits are purchased). One credit is spent per session created.
app.post("/api/sessions", (req, res) => {
  const apiKey = req.header("x-api-key");
  const account = apiKey ? getAccount(apiKey) : null;

  if (!account) {
    return res.status(401).json({ error: "missing or invalid x-api-key. Buy credits at POST /api/checkout." });
  }
  if (!consumeCredit(apiKey)) {
    return res.status(402).json({ error: "no interview credits remaining", checkoutUrl: "/api/checkout" });
  }

  const id = nanoid(10);
  const session = createSession(id);
  res.json({
    sessionId: session.id,
    candidateLink: `${PUBLIC_URL}/join/${session.id}`,
    deepLink: `interviewguard://join/${session.id}`,
    creditsRemaining: account.credits,
  });
});

app.get("/api/sessions/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "not found" });
  res.json({
    id: session.id,
    state: session.state,
    status: session.status,
    flags: session.flags,
  });
});

// Landing page the candidate hits from the link. Detects OS from the
// user-agent and serves the matching signed installer — the GitHub
// "releases/latest/download/<fixed-name>" URL never changes between
// versions because artifactName is pinned in companion/package.json, so
// these links don't need updating on every release.
const GH_OWNER = process.env.GH_RELEASE_OWNER || "REPLACE_WITH_YOUR_GITHUB_ORG";
const GH_REPO = process.env.GH_RELEASE_REPO || "interview-guard";
const RELEASE_BASE = `https://github.com/${GH_OWNER}/${GH_REPO}/releases/latest/download`;
const DOWNLOADS = {
  win: `${RELEASE_BASE}/InterviewGuard-Setup.exe`,
  mac: `${RELEASE_BASE}/InterviewGuard.dmg`,
};

function detectOS(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (ua.includes("windows")) return "win";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "mac";
  return "unknown";
}

app.get("/join/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).send("This interview link is invalid or has expired.");

  const os = detectOS(req.headers["user-agent"]);
  const primaryDownload = DOWNLOADS[os];

  // What-to-expect copy matters here — this is the SmartScreen/Gatekeeper
  // click-through guidance discussed earlier, shown before the candidate
  // hits the dialog instead of leaving them to guess mid-download.
  const winNote = `<p><strong>Windows:</strong> you may see a "Windows protected your PC" screen the
    first time you run this — that's normal for a newly released app and fades as more people install
    it. Click <em>More info</em>, then <em>Run anyway</em>.</p>`;
  const macNote = `<p><strong>Mac:</strong> the app is signed and notarized by Apple, so you'll see a
    one-time "downloaded from the internet, are you sure?" prompt — click <em>Open</em>.</p>`;

  res.send(`<!doctype html>
<html><body style="font-family:sans-serif;max-width:480px;margin:60px auto">
  <h2>Join your interview session</h2>
  <p>Session code: <code>${session.id}</code></p>

  ${primaryDownload
    ? `<p><a href="${primaryDownload}" style="display:inline-block;padding:10px 16px;background:#1a1a1a;color:#fff;border-radius:8px;text-decoration:none">Download for ${os === "win" ? "Windows" : "Mac"}</a></p>
       ${os === "win" ? winNote : macNote}`
    : `<p>Choose your platform:</p>
       <p><a href="${DOWNLOADS.win}">Download for Windows</a> &nbsp;|&nbsp; <a href="${DOWNLOADS.mac}">Download for Mac</a></p>`
  }

  <p style="color:#666;font-size:13px">Already installed?
    <a href="interviewguard://join/${session.id}">Open Interview Guard directly</a>.</p>
</body></html>`);
});

app.get("/api/health", (_req, res) => res.json({ ok: true, sessions: allSessions().length }));

// --- WebSocket relay ----------------------------------------------------
// ws://host/ws?sessionId=...&role=interviewer|candidate

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket, req) => {
  const url = new URL(req.url, "http://localhost");
  const sessionId = url.searchParams.get("sessionId");
  const role = url.searchParams.get("role");
  const session = getSession(sessionId);

  if (!session || (role !== "interviewer" && role !== "candidate")) {
    socket.close(4000, "invalid session or role");
    return;
  }

  if (role === "interviewer") {
    session.interviewerSocket = socket;
    socket.send(JSON.stringify({ type: "state", status: session.status, flags: session.flags }));
  } else {
    session.candidateSocket = socket;
    session.state = "active";
    notifyInterviewer(session, { type: "candidate_connected" });
  }

  socket.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (role === "candidate" && msg.type === "status") {
      // { type: "status", status: "clear"|"flagged", flags: [{kind, detail}] }
      session.status = msg.status;
      if (Array.isArray(msg.flags)) {
        for (const f of msg.flags) {
          session.flags.push({ ts: Date.now(), kind: f.kind, detail: f.detail });
        }
      }
      notifyInterviewer(session, { type: "state", status: session.status, flags: session.flags });
    }
  });

  socket.on("close", () => {
    if (role === "interviewer") session.interviewerSocket = null;
    if (role === "candidate") {
      session.candidateSocket = null;
      notifyInterviewer(session, { type: "candidate_disconnected" });
    }
  });
});

function notifyInterviewer(session, payload) {
  if (session.interviewerSocket && session.interviewerSocket.readyState === 1) {
    session.interviewerSocket.send(JSON.stringify(payload));
  }
}

server.listen(PORT, () => {
  console.log(`interview-guard server on ${PUBLIC_URL}`);
});
