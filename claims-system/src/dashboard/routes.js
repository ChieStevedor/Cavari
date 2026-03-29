const express      = require('express');
const router       = express.Router();
const sheetsClient = require('../sheets/client');
const { applyManualDecision } = require('../decision/engine');

// ── Mock data (used when Google Sheets is not yet configured) ─────────────────
const MOCK_CLAIMS = [
  {
    'Claim ID': 'CAV-CLM-X7K-4MQZ', 'Date Received': '2026-03-20T14:32:00Z',
    'Customer Email': 'jane.smith@studio.com', 'Customer Name': 'Jane Smith',
    'Order #': '#CAV-1042', 'Order Value': '640', 'Currency': 'USD',
    'Items': 'Murano Pendant Light, Brass Wall Sconce',
    'Carrier': 'FedEx', 'Tracking #': '794644823917',
    'Shipped At': '2026-03-17T09:00:00Z', 'Delivered At': '2026-03-19T14:10:00Z',
    'Damage Description': 'Glass shade arrived shattered, box heavily crushed on one side.',
    'Photo Path': '', 'Label OCR': 'Yes', 'OCR Tracking': '794644823917',
    'Damage Score': '9', 'Product Match': 'yes',
    'Hard Blocks': '', 'Soft Flags': '',
    'Decision': 'APPROVED', 'Decision Date': '2026-03-20T14:32:45Z',
    'FedEx Claim #': 'FX-2026-88421', 'Notes': '',
  },
  {
    'Claim ID': 'CAV-CLM-R3P-9LFT', 'Date Received': '2026-03-22T09:15:00Z',
    'Customer Email': 'marcus.lee@archdesign.ca', 'Customer Name': 'Marcus Lee',
    'Order #': '#CAV-1055', 'Order Value': '1280', 'Currency': 'USD',
    'Items': 'Artemide Tolomeo Floor Lamp',
    'Carrier': 'FedEx', 'Tracking #': '794644823955',
    'Shipped At': '2026-03-18T10:00:00Z', 'Delivered At': '2026-03-21T11:30:00Z',
    'Damage Description': 'Base of the lamp is bent, packaging intact.',
    'Photo Path': '', 'Label OCR': 'Yes', 'OCR Tracking': '794644823955',
    'Damage Score': '6', 'Product Match': 'uncertain',
    'Hard Blocks': '', 'Soft Flags': 'Product match uncertain | Order value $1280 exceeds auto-approve threshold',
    'Decision': 'MANUAL_REVIEW', 'Decision Date': '2026-03-22T09:15:30Z',
    'FedEx Claim #': '', 'Notes': '',
  },
  {
    'Claim ID': 'CAV-CLM-B2N-7QWX', 'Date Received': '2026-03-24T16:50:00Z',
    'Customer Email': 'unknown@gmail.com', 'Customer Name': '',
    'Order #': '', 'Order Value': '', 'Currency': '',
    'Items': '', 'Carrier': '', 'Tracking #': '',
    'Shipped At': '', 'Delivered At': '',
    'Damage Description': 'Box damaged.',
    'Photo Path': '', 'Label OCR': 'No', 'OCR Tracking': '',
    'Damage Score': '3', 'Product Match': 'no',
    'Hard Blocks': 'Email address not found in Shopify customer database.',
    'Soft Flags': 'No shipping label visible in photo | Low damage confidence score: 3/10',
    'Decision': 'REJECTED', 'Decision Date': '2026-03-24T16:50:55Z',
    'FedEx Claim #': '', 'Notes': 'Sender not a Cavari customer.',
  },
  {
    'Claim ID': 'CAV-CLM-K9H-2DRV', 'Date Received': '2026-03-26T11:05:00Z',
    'Customer Email': 'sofia.m@interiorsnyc.com', 'Customer Name': 'Sofia Moreau',
    'Order #': '#CAV-1061', 'Order Value': '420', 'Currency': 'USD',
    'Items': 'Foscarini Aplomb Pendant',
    'Carrier': 'FedEx', 'Tracking #': '794644824001',
    'Shipped At': '2026-03-23T08:00:00Z', 'Delivered At': '2026-03-25T13:20:00Z',
    'Damage Description': 'Concrete pendant cracked, possibly dropped during delivery.',
    'Photo Path': '', 'Label OCR': 'Yes', 'OCR Tracking': '794644824001',
    'Damage Score': '8', 'Product Match': 'yes',
    'Hard Blocks': '', 'Soft Flags': 'Repeat claimant — 2 prior claims on file',
    'Decision': 'MANUAL_REVIEW', 'Decision Date': '2026-03-26T11:05:20Z',
    'FedEx Claim #': '', 'Notes': '',
  },
];

const MOCK_CARRIER_CLAIMS = [
  {
    'Claim ID': 'CAV-CLM-X7K-4MQZ', 'FedEx Claim #': 'FX-2026-88421',
    'Submitted Date': '2026-03-20T14:35:00Z', 'Last Checked': '2026-03-26T08:00:00Z',
    'Status': 'Under Review', 'Amount Claimed': '640', 'Amount Reimbursed': '', 'Payment Date': '', 'Notes': '',
  },
];

function computeStats(claims, carrierClaims) {
  const total    = claims.length;
  const approved = claims.filter(c => c['Decision'] === 'APPROVED').length;
  const rejected = claims.filter(c => c['Decision'] === 'REJECTED').length;
  const pending  = claims.filter(c => c['Decision'] === 'MANUAL_REVIEW').length;

  const totalClaimed    = carrierClaims.reduce((s, c) => s + (parseFloat(c['Amount Claimed'])    || 0), 0);
  const totalReimbursed = carrierClaims.reduce((s, c) => s + (parseFloat(c['Amount Reimbursed']) || 0), 0);
  const paidCount       = carrierClaims.filter(c => c['Status'] === 'Paid').length;
  const openCarrierClaims = carrierClaims.filter(c =>
    ['Submitted', 'Under Review', 'Processing'].includes(c['Status'])).length;

  return {
    claims:   { total, approved, rejected, pending },
    recovery: { totalClaimed, totalReimbursed, paidCount, openCarrierClaims },
  };
}

// ── GET /api/claims ───────────────────────────────────────────────────────────
router.get('/claims', async (req, res) => {
  try {
    const claims = await sheetsClient.getAllClaims();
    res.json({ ok: true, data: claims });
  } catch {
    res.json({ ok: true, data: MOCK_CLAIMS, _mock: true });
  }
});

// ── GET /api/carrier-claims ───────────────────────────────────────────────────
router.get('/carrier-claims', async (req, res) => {
  try {
    const data = await sheetsClient.getAllCarrierClaims();
    res.json({ ok: true, data });
  } catch {
    res.json({ ok: true, data: MOCK_CARRIER_CLAIMS, _mock: true });
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [claims, carrierClaims] = await Promise.all([
      sheetsClient.getAllClaims(),
      sheetsClient.getAllCarrierClaims(),
    ]);
    res.json({ ok: true, data: computeStats(claims, carrierClaims) });
  } catch {
    res.json({ ok: true, data: computeStats(MOCK_CLAIMS, MOCK_CARRIER_CLAIMS), _mock: true });
  }
});

// ── POST /api/claims/:claimId/decide ─────────────────────────────────────────
router.post('/claims/:claimId/decide', express.json(), async (req, res) => {
  const { claimId } = req.params;
  const { decision, notes, customerEmail, customerName } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ ok: false, error: 'Decision must be APPROVED or REJECTED' });
  }

  try {
    await applyManualDecision({ claimId, decision, notes, customerEmail, customerName });
    res.json({ ok: true, claimId, decision });
  } catch (err) {
    // In mock mode, just confirm the action without persisting
    console.warn('[api] Decision not persisted (Sheets not configured):', err.message);
    res.json({ ok: true, claimId, decision, _mock: true });
  }
});

module.exports = router;
