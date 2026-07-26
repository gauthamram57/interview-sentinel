import Stripe from "stripe";
import express from "express";
import { createAccount, addCredits, linkStripeSession, getApiKeyForStripeSession } from "./accounts.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:4000";

// Credit packs. Swap prices for real Stripe Price IDs once you've created
// them in the Stripe dashboard — using price_data here so this runs with
// zero dashboard setup, but a real Price object is what you want for
// subscriptions/recurring billing later.
const PACKS = {
  starter: { name: "Starter — 20 interview credits", credits: 20, unitAmountCents: 4900 },
  growth: { name: "Growth — 75 interview credits", credits: 75, unitAmountCents: 14900 },
};

export const billingRouter = express.Router();

// POST /api/checkout  { pack: "starter"|"growth", email }
billingRouter.post("/checkout", express.json(), async (req, res) => {
  const { pack, email } = req.body || {};
  const selected = PACKS[pack];
  if (!selected) return res.status(400).json({ error: "unknown pack" });

  try {
    const apiKey = createAccount(email);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: selected.name },
            unit_amount: selected.unitAmountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_URL}/checkout/cancelled`,
      metadata: { pack, credits: String(selected.credits), apiKey },
    });

    linkStripeSession(session.id, apiKey);
    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("checkout creation failed:", err.message);
    res.status(500).json({ error: "could not start checkout" });
  }
});

// GET /checkout/success?session_id=... — candidate/buyer lands here after
// paying. In a real product you'd email the API key instead of showing it
// in the browser, but this keeps the loop demonstrable end-to-end. Exported
// separately (not on billingRouter, which is mounted under /api) so
// index.js can mount it at the top-level /checkout/success path Stripe
// redirects to.
export function checkoutSuccessHandler(req, res) {
  const apiKey = getApiKeyForStripeSession(req.query.session_id);
  if (!apiKey) return res.status(404).send("Session not found.");
  res.send(`<!doctype html><body style="font-family:sans-serif;max-width:480px;margin:60px auto">
    <h2>You're set up</h2>
    <p>Your API key (save this — it won't be shown again):</p>
    <code style="display:block;padding:12px;background:#f2f2f2;border-radius:8px">${apiKey}</code>
    <p>Use it in the <code>x-api-key</code> header when calling <code>POST /api/sessions</code>.</p>
  </body></html>`);
}

// Stripe webhook — must receive the raw request body for signature
// verification, so it's mounted with express.raw() in index.js BEFORE the
// global express.json() middleware runs on other routes.
export async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = process.env.STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      : JSON.parse(req.body.toString()); // dev fallback with no signing secret
  } catch (err) {
    console.error("webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const apiKey = session.metadata?.apiKey;
    const credits = Number(session.metadata?.credits || 0);
    if (apiKey && credits > 0) {
      addCredits(apiKey, credits);
      console.log(`fulfilled ${credits} credits for ${apiKey}`);
    }
  }

  res.json({ received: true });
}
