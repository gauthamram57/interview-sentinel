// Point this at your server. For local dev, the defaults just work.
const API_BASE = "http://localhost:4000";
const WS_BASE = "ws://localhost:4000";

const createBtn = document.getElementById("createBtn");
const linkBox = document.getElementById("linkBox");
const linkInput = document.getElementById("linkInput");
const creditsNote = document.getElementById("creditsNote");
const apiKeyInput = document.getElementById("apiKeyInput");
const buyLink = document.getElementById("buyLink");
const statusCard = document.getElementById("statusCard");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const flagsList = document.getElementById("flags");

createBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return alert("Enter your API key first (or buy a credit pack below).");

  createBtn.disabled = true;
  createBtn.textContent = "Creating…";

  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
  });
  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Could not create session");
    createBtn.disabled = false;
    createBtn.textContent = "Create interview link";
    return;
  }

  linkInput.value = data.candidateLink;
  creditsNote.textContent = `Credits remaining: ${data.creditsRemaining}`;
  linkBox.style.display = "block";
  statusCard.style.display = "block";
  createBtn.disabled = false;
  createBtn.textContent = "Create another";

  connect(data.sessionId);
});

buyLink.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = prompt("Email for your receipt and API key:");
  if (!email) return;

  const res = await fetch(`${API_BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pack: "starter", email }),
  });
  const data = await res.json();
  if (data.checkoutUrl) {
    window.location.href = data.checkoutUrl;
  } else {
    alert(data.error || "Could not start checkout");
  }
});

function connect(sessionId) {
  const ws = new WebSocket(`${WS_BASE}/ws?sessionId=${sessionId}&role=interviewer`);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "candidate_connected") {
      statusText.textContent = "Candidate connected — monitoring active";
    }
    if (msg.type === "candidate_disconnected") {
      statusText.textContent = "Candidate disconnected";
      statusDot.className = "dot";
    }
    if (msg.type === "state") {
      renderStatus(msg.status);
      renderFlags(msg.flags);
    }
  };

  ws.onclose = () => {
    statusText.textContent = "Connection lost";
  };
}

function renderStatus(status) {
  statusDot.className = `dot ${status}`;
  statusText.textContent = status === "flagged"
    ? "Flagged — possible hidden overlay or blocked app detected"
    : "Clear";
}

function renderFlags(flags) {
  flagsList.innerHTML = "";
  for (const f of [...flags].reverse()) {
    const li = document.createElement("li");
    const time = new Date(f.ts).toLocaleTimeString();
    li.textContent = `[${time}] ${f.kind}: ${f.detail}`;
    flagsList.appendChild(li);
  }
}
