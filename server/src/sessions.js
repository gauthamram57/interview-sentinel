// In-memory session store. Swap for Redis/Postgres before running this for
// real — this resets on server restart and doesn't scale past one instance.

const sessions = new Map();

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {'pending'|'active'|'ended'} state
 * @property {'clear'|'flagged'} status
 * @property {Array<{ts:number, kind:string, detail:string}>} flags
 * @property {WebSocket|null} interviewerSocket
 * @property {WebSocket|null} candidateSocket
 * @property {number} createdAt
 */

export function createSession(id) {
  /** @type {Session} */
  const session = {
    id,
    state: "pending",
    status: "clear",
    flags: [],
    interviewerSocket: null,
    candidateSocket: null,
    createdAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id) {
  return sessions.get(id) || null;
}

export function deleteSession(id) {
  sessions.delete(id);
}

export function allSessions() {
  return [...sessions.values()];
}
