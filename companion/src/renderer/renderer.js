const joinForm = document.getElementById("joinForm");
const statusView = document.getElementById("statusView");
const codeInput = document.getElementById("codeInput");
const joinBtn = document.getElementById("joinBtn");
const dot = document.getElementById("dot");
const statusText = document.getElementById("statusText");

joinBtn.addEventListener("click", () => {
  const code = codeInput.value.trim();
  if (!code) return;
  window.interviewGuard.joinSession(code);
  joinForm.style.display = "none";
  statusView.style.display = "block";
});

window.interviewGuard.onConnected(() => {
  statusText.textContent = "Connected — monitoring active";
});

window.interviewGuard.onDisconnected(() => {
  statusText.textContent = "Disconnected";
  dot.className = "dot";
});

window.interviewGuard.onScanResult(({ status }) => {
  dot.className = `dot ${status}`;
  statusText.textContent = status === "flagged" ? "Flag detected" : "Clear";
});

window.interviewGuard.onError(({ message }) => {
  statusText.textContent = `Error: ${message}`;
});
