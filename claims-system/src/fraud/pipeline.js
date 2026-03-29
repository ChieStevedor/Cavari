const {
  checkShippingLabel,
  checkDamageEvidence,
  checkProductMatch,
  checkTimeWindow,
  checkTrackingMatch,
} = require('./checks');
const sheetsClient = require('../sheets/client');
const cfg          = require('../config');

// ── Run all checks in parallel ────────────────────────────────────────────────

async function runFraudPipeline({ claim, shopifyData }) {
  const photo      = claim.photos[0];     // primary damage photo
  const imageBuffer = photo.buffer;
  const { order, shipment, customer } = shopifyData;

  // All vision checks fire simultaneously
  const [labelResult, damageResult, productResult, claimHistory] = await Promise.all([
    checkShippingLabel(imageBuffer),
    checkDamageEvidence(imageBuffer),
    checkProductMatch(imageBuffer, order.items),
    sheetsClient.getClaimHistory(customer.email),
  ]);

  const timeResult     = checkTimeWindow(shipment.deliveredAt, cfg.rules.claimWindowHours);
  const trackingResult = checkTrackingMatch(labelResult.trackingNumber, shipment.trackingNumber);

  // ── Assemble results ────────────────────────────────────────────────────────

  const hardBlocks = [];
  const softFlags  = [];

  // Hard: tracking number mismatch (label visible but doesn't match order)
  if (labelResult.found && trackingResult.match === false) {
    hardBlocks.push(`Tracking number mismatch — label shows ${labelResult.trackingNumber}, order has ${shipment.trackingNumber}`);
  }

  // Hard: claim submitted too long after delivery
  if (timeResult.withinWindow === false) {
    hardBlocks.push(`Outside claim window — ${timeResult.note}`);
  }

  // Soft: no shipping label visible in photo
  if (!labelResult.found) {
    softFlags.push('No shipping label visible in photo');
  }

  // Soft: low damage evidence confidence
  if (damageResult.confidence < 5) {
    softFlags.push(`Low damage confidence score: ${damageResult.confidence}/10 — "${damageResult.description}"`);
  }

  // Soft: product doesn't match what was ordered
  if (productResult.matches === 'no') {
    softFlags.push(`Product mismatch — ${productResult.note}`);
  }

  // Soft: repeat claimant
  if (claimHistory.count >= 2) {
    softFlags.push(`Repeat claimant — ${claimHistory.count} prior claims on file`);
  }

  // Soft: high order value needs manual eyes
  if (order.orderValue >= cfg.rules.autoApproveThreshold) {
    softFlags.push(`Order value ${order.currency} ${order.orderValue} exceeds auto-approve threshold of ${cfg.rules.autoApproveThreshold}`);
  }

  return {
    checks: {
      label:    labelResult,
      damage:   damageResult,
      product:  productResult,
      time:     timeResult,
      tracking: trackingResult,
      history:  claimHistory,
    },
    hardBlocks,
    softFlags,
  };
}

module.exports = { runFraudPipeline };
