// In-memory account store. Swap for Postgres before real launch — this is
// here so the billing flow is demonstrably wired end-to-end, not a stub.

import { randomBytes } from "node:crypto";

const accounts = new Map(); // apiKey -> { credits, email, createdAt }
const stripeSessionToApiKey = new Map(); // stripe checkout session id -> apiKey, for the success redirect

export function createAccount(email) {
  const apiKey = "ig_" + randomBytes(20).toString("hex");
  accounts.set(apiKey, { credits: 0, email, createdAt: Date.now() });
  return apiKey;
}

export function getAccount(apiKey) {
  return accounts.get(apiKey) || null;
}

export function addCredits(apiKey, amount) {
  const account = accounts.get(apiKey);
  if (!account) return null;
  account.credits += amount;
  return account;
}

export function consumeCredit(apiKey) {
  const account = accounts.get(apiKey);
  if (!account || account.credits <= 0) return false;
  account.credits -= 1;
  return true;
}

export function linkStripeSession(stripeSessionId, apiKey) {
  stripeSessionToApiKey.set(stripeSessionId, apiKey);
}

export function getApiKeyForStripeSession(stripeSessionId) {
  return stripeSessionToApiKey.get(stripeSessionId) || null;
}
