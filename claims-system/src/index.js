require('dotenv').config();
const express   = require('express');
const path      = require('path');
const cron      = require('node-cron');
const cfg       = require('./config');

const { fetchNewClaims }          = require('./gmail/watcher');
const { resolveCustomerAndOrder } = require('./shopify/lookup');
const { runFraudPipeline }        = require('./fraud/pipeline');
const { processClaim }            = require('./decision/engine');
const { submitFedexClaim }        = require('./fedex/agent');
const { runReimbursementTracker } = require('./fedex/tracker');
const dashboardRoutes             = require('./dashboard/routes');

const app = express();

// ── Static files (dashboard) ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', dashboardRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ── Core claim processing pipeline ───────────────────────────────────────────

async function handleIncomingEmail(inboundClaim) {
  const { senderEmail, photos } = inboundClaim;
  console.log(`\n[pipeline] New claim from ${senderEmail}`);

  // 1. Must have at least one photo
  if (!photos || photos.length === 0) {
    console.log(`[pipeline] No photo attached — ignoring email from ${senderEmail}`);
    return;
  }

  // 2. Identify customer and order via Shopify
  const shopifyData = await resolveCustomerAndOrder(senderEmail);
  if (!shopifyData.found) {
    console.log(`[pipeline] ${senderEmail} — ${shopifyData.reason}`);
    return;
  }

  // 3. Run fraud checks in parallel
  const fraudResult = await runFraudPipeline({ claim: inboundClaim, shopifyData });

  // 4. Make and persist decision, notify customer if auto-decided
  const { claimId, decision } = await processClaim({ inboundClaim, shopifyData, fraudResult });

  // 5. Submit carrier claim to FedEx regardless of customer decision
  //    (Cavari files with the carrier no matter what — the customer still
  //     needs to return the item to receive a refund/replacement)
  setImmediate(async () => {
    try {
      await submitFedexClaim({
        claimId,
        trackingNumber:   shopifyData.shipment.trackingNumber,
        carrier:          shopifyData.shipment.carrier,
        shipment:         shopifyData.shipment,
        order:            shopifyData.order,
        damageDescription: inboundClaim.message,
        photoPath:        photos[0]?.path,
      });
    } catch (err) {
      console.error('[pipeline] FedEx agent error:', err.message);
    }
  });

  console.log(`[pipeline] Claim ${claimId} processed → ${decision}`);
}

// ── Gmail poller ──────────────────────────────────────────────────────────────

async function pollGmail() {
  try {
    const claims = await fetchNewClaims();
    for (const claim of claims) {
      await handleIncomingEmail(claim);
    }
  } catch (err) {
    console.error('[gmail-poll] Error:', err.message);
  }
}

// ── Scheduled jobs ────────────────────────────────────────────────────────────

// Poll Gmail at configured interval (default: every 2 minutes)
setInterval(pollGmail, cfg.gmail.pollInterval);

// Daily reimbursement tracker at 08:00
cron.schedule('0 8 * * *', async () => {
  console.log('[cron] Running daily reimbursement tracker…');
  try {
    await runReimbursementTracker();
  } catch (err) {
    console.error('[cron] Tracker error:', err.message);
  }
});

// ── Start server ──────────────────────────────────────────────────────────────

app.listen(cfg.server.port, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║          CAVARI CLAIMS SYSTEM                    ║
╠══════════════════════════════════════════════════╣
║  Dashboard  →  http://localhost:${cfg.server.port}           ║
║  API        →  http://localhost:${cfg.server.port}/api       ║
║  Gmail poll →  every ${Math.round(cfg.gmail.pollInterval/60000)}m                       ║
║  Tracker    →  daily at 08:00                    ║
╚══════════════════════════════════════════════════╝
  `);
  // Initial poll on startup
  pollGmail();
});
