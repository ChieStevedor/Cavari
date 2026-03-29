require('dotenv').config();
const { runFraudPipeline } = require('../src/fraud/pipeline');
const { processClaim }     = require('../src/decision/engine');
const fs = require('fs');

// ── Simulated inbound email ───────────────────────────────────────────────────
const mockClaim = {
  gmailMessageId: 'test-' + Date.now(),
  senderEmail:    'jane.smith@studio.com',
  subject:        'Damaged delivery',
  receivedAt:     new Date().toISOString(),
  message:        'Hi, my parcel arrived completely crushed. The glass shade inside is shattered.',
  photos: [{
    path:     'uploads/123.jpeg',
    buffer:   fs.readFileSync('uploads/123.jpeg'),
    filename: '123.jpeg',
  }],
};

// ── Simulated Shopify data (no Shopify account yet) ───────────────────────────
const mockShopifyData = {
  found: true,
  customer: {
    id:    10001,
    name:  'Jane Smith',
    email: 'jane.smith@studio.com',
    phone: '+1-416-555-0192',
  },
  order: {
    id:         5001,
    name:       '#CAV-1042',
    createdAt:  '2026-03-20T09:00:00Z',
    orderValue: 640,
    currency:   'USD',
    items: [
      { name: 'Murano Pendant Light — Amber', quantity: 1, price: 480, sku: 'MPL-AMB-001' },
      { name: 'Brass Ceiling Canopy',         quantity: 1, price: 160, sku: 'BCC-002' },
    ],
  },
  shipment: {
    carrier:        'FedEx',
    trackingNumber: 'POD-87694',
    trackingUrl:    null,
    shippedAt:      '2026-03-22T10:00:00Z',
    deliveredAt:    '2026-03-26T14:10:00Z',
  },
};

async function run() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CAVARI CLAIMS — Full Pipeline Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📧 Inbound email from:', mockClaim.senderEmail);
  console.log('   Message: "' + mockClaim.message + '"');
  console.log('   Photo:   ' + mockClaim.photos[0].filename + '\n');

  console.log('🛍  Shopify lookup → customer & order found');
  console.log('   Customer:  ' + mockShopifyData.customer.name);
  console.log('   Order:     ' + mockShopifyData.order.name + ' — $' + mockShopifyData.order.orderValue);
  console.log('   Carrier:   ' + mockShopifyData.shipment.carrier);
  console.log('   Tracking:  ' + mockShopifyData.shipment.trackingNumber + '\n');

  console.log('🔍 Running fraud checks (Claude Vision)…\n');

  const fraudResult = await runFraudPipeline({
    claim:       mockClaim,
    shopifyData: mockShopifyData,
  });

  const { checks, hardBlocks, softFlags } = fraudResult;

  console.log('   Label OCR:      ' + (checks.label.found ? `✓ Found — tracking: ${checks.label.trackingNumber}` : '✗ Not found'));
  console.log('   Tracking match: ' + (checks.tracking.match === true ? '✓ Match' : checks.tracking.match === false ? '✗ MISMATCH' : '— N/A'));
  console.log('   Damage score:   ' + checks.damage.confidence + '/10 — "' + checks.damage.description.slice(0, 80) + '…"');
  console.log('   Product match:  ' + checks.product.matches + ' — ' + checks.product.note.slice(0, 80));
  console.log('   Time window:    ' + checks.time.note);
  console.log('   Claim history:  ' + checks.history.count + ' prior claim(s)\n');

  if (hardBlocks.length) {
    console.log('🚫 Hard blocks:');
    hardBlocks.forEach(b => console.log('   — ' + b));
  } else {
    console.log('✓  No hard blocks');
  }

  if (softFlags.length) {
    console.log('⚠️  Soft flags:');
    softFlags.forEach(f => console.log('   — ' + f));
  } else {
    console.log('✓  No soft flags');
  }

  console.log('\n⚙️  Running decision engine…\n');

  const { claimId, decision } = await processClaim({
    inboundClaim: mockClaim,
    shopifyData:  mockShopifyData,
    fraudResult,
  });

  const icon = decision === 'APPROVED' ? '✅' : decision === 'REJECTED' ? '❌' : '🟡';
  console.log(`${icon} Decision: ${decision}`);
  console.log(`   Claim ID: ${claimId}`);
  console.log('\n📊 Check your Google Sheet — the claim has been written.\n');

  if (decision === 'APPROVED') {
    console.log('📨 Customer notified: approval email sent to ' + mockClaim.senderEmail);
  } else if (decision === 'REJECTED') {
    console.log('📨 Customer notified: rejection email sent to ' + mockClaim.senderEmail);
  } else {
    console.log('📋 Claim queued for manual review in the dashboard.');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Pipeline test complete.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

run().catch(err => {
  console.error('\n✗ Pipeline error:', err.message);
  process.exit(1);
});
