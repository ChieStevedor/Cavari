const { v4: uuidv4 } = require('uuid');
const sheetsClient  = require('../sheets/client');
const { notifyApproved, notifyRejected } = require('../gmail/reply');
const cfg = require('../config');

// ── Decision types ────────────────────────────────────────────────────────────
const DECISION = {
  AUTO_APPROVE:   'APPROVED',
  MANUAL_REVIEW:  'MANUAL_REVIEW',
  AUTO_REJECT:    'REJECTED',
};

// ── Generate claim ID ─────────────────────────────────────────────────────────
function genClaimId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'CAV-CLM-';
  for (let i = 0; i < 3; i++) id += chars[Math.floor(Math.random() * chars.length)];
  id += '-';
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ── Core engine ───────────────────────────────────────────────────────────────

async function processClaim({ inboundClaim, shopifyData, fraudResult }) {
  const claimId   = genClaimId();
  const now       = new Date().toISOString();
  const { customer, order, shipment } = shopifyData;
  const { hardBlocks, softFlags, checks } = fraudResult;
  const photo     = inboundClaim.photos[0];

  // ── Determine decision ──────────────────────────────────────────────────────

  let decision;
  let rejectReason = '';

  if (hardBlocks.length > 0) {
    decision     = DECISION.AUTO_REJECT;
    rejectReason = hardBlocks[0];
  } else if (softFlags.length > 0) {
    decision = DECISION.MANUAL_REVIEW;
  } else {
    decision = DECISION.AUTO_APPROVE;
  }

  // ── Persist to Google Sheets ────────────────────────────────────────────────

  await sheetsClient.saveClaim({
    claimId,
    receivedAt:       inboundClaim.receivedAt || now,
    customerEmail:    customer.email,
    customerName:     customer.name,
    orderName:        order.name,
    orderValue:       order.orderValue,
    currency:         order.currency,
    items:            order.items,
    carrier:          shipment.carrier,
    trackingNumber:   shipment.trackingNumber,
    shippedAt:        shipment.shippedAt,
    deliveredAt:      shipment.deliveredAt,
    damageDescription: inboundClaim.message,
    photoPath:        photo?.path || '',
    labelOcr:         checks.label.found,
    ocrTracking:      checks.label.trackingNumber,
    damageScore:      checks.damage.confidence,
    productMatch:     checks.product.matches,
    hardBlocks,
    softFlags,
    decision,
    decisionDate:     now,
  });

  await sheetsClient.upsertCustomer(customer.email, customer.name, decision);

  // ── Notify customer ─────────────────────────────────────────────────────────

  if (decision === DECISION.AUTO_APPROVE) {
    await notifyApproved({
      to:           customer.email,
      claimId,
      customerName: customer.name,
    });
  } else if (decision === DECISION.AUTO_REJECT) {
    await notifyRejected({
      to:           customer.email,
      claimId,
      customerName: customer.name,
      reason:       rejectReason,
    });
  }
  // MANUAL_REVIEW: no email sent until ops team decides

  console.log(`[engine] Claim ${claimId} → ${decision} | Blocks: ${hardBlocks.length} | Flags: ${softFlags.length}`);

  return { claimId, decision, hardBlocks, softFlags };
}

// ── Manual decision from ops dashboard ───────────────────────────────────────

async function applyManualDecision({ claimId, decision, notes, customerEmail, customerName }) {
  await sheetsClient.updateClaimDecision(claimId, decision, notes);
  await sheetsClient.upsertCustomer(customerEmail, customerName, decision);

  if (decision === DECISION.AUTO_APPROVE) {
    await notifyApproved({ to: customerEmail, claimId, customerName });
  } else if (decision === DECISION.AUTO_REJECT) {
    await notifyRejected({ to: customerEmail, claimId, customerName, reason: notes });
  }

  console.log(`[engine] Manual decision on ${claimId} → ${decision}`);
}

module.exports = { processClaim, applyManualDecision, DECISION };
