const { google } = require('googleapis');
const cfg = require('../config');

// ── Auth ──────────────────────────────────────────────────────────────────────

function buildAuth() {
  const auth = new google.auth.OAuth2(
    cfg.google.clientId,
    cfg.google.clientSecret,
    cfg.google.redirectUri,
  );
  auth.setCredentials({
    access_token:  cfg.google.accessToken,
    refresh_token: cfg.google.refreshToken,
  });
  return auth;
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: buildAuth() });
}

const SSID = () => cfg.sheets.spreadsheetId;

// ── Sheet headers (auto-created on first write) ───────────────────────────────

const HEADERS = {
  Claims: [
    'Claim ID', 'Date Received', 'Customer Email', 'Customer Name',
    'Order #', 'Order Value', 'Currency', 'Items',
    'Carrier', 'Tracking #', 'Shipped At', 'Delivered At',
    'Damage Description', 'Photo Path',
    'Label OCR', 'OCR Tracking', 'Damage Score', 'Product Match',
    'Hard Blocks', 'Soft Flags',
    'Decision', 'Decision Date', 'FedEx Claim #', 'Notes',
  ],
  'Carrier Claims': [
    'Claim ID', 'FedEx Claim #', 'Submitted Date', 'Last Checked',
    'Status', 'Amount Claimed', 'Amount Reimbursed', 'Payment Date', 'Notes',
  ],
  Customers: [
    'Email', 'Name', 'Total Claims', 'Approved', 'Rejected',
    'Pending', 'Last Claim Date', 'Fraud Score',
  ],
};

async function ensureHeaders(tabName) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SSID(),
    range:         `${tabName}!A1:Z1`,
  });
  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId:     SSID(),
      range:             `${tabName}!A1`,
      valueInputOption:  'RAW',
      requestBody:       { values: [HEADERS[tabName]] },
    });
  }
}

// ── Append a row ──────────────────────────────────────────────────────────────

async function appendRow(tabName, values) {
  await ensureHeaders(tabName);
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId:     SSID(),
    range:             `${tabName}!A1`,
    valueInputOption:  'USER_ENTERED',
    insertDataOption:  'INSERT_ROWS',
    requestBody:       { values: [values] },
  });
}

// ── Find row by column value ──────────────────────────────────────────────────

async function findRow(tabName, colIndex, value) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SSID(),
    range:         `${tabName}!A:Z`,
  });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colIndex] === value) return { rowIndex: i + 1, row: rows[i] };
  }
  return null;
}

// ── Update a specific cell ────────────────────────────────────────────────────

async function updateCell(tabName, rowNumber, colLetter, value) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId:    SSID(),
    range:            `${tabName}!${colLetter}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody:      { values: [[value]] },
  });
}

// ── Get all rows ──────────────────────────────────────────────────────────────

async function getAllRows(tabName) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SSID(),
    range:         `${tabName}!A:Z`,
  });
  const [headers, ...rows] = res.data.values || [[]];
  if (!headers) return [];
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ''; });
    return obj;
  });
}

// ── Domain helpers ────────────────────────────────────────────────────────────

async function saveClaim(claimData) {
  const {
    claimId, receivedAt, customerEmail, customerName,
    orderName, orderValue, currency, items,
    carrier, trackingNumber, shippedAt, deliveredAt,
    damageDescription, photoPath,
    labelOcr, ocrTracking, damageScore, productMatch,
    hardBlocks, softFlags,
    decision, decisionDate,
  } = claimData;

  await appendRow('Claims', [
    claimId,
    receivedAt,
    customerEmail,
    customerName,
    orderName,
    orderValue,
    currency,
    Array.isArray(items) ? items.map(i => i.name).join(', ') : items,
    carrier,
    trackingNumber || '',
    shippedAt      || '',
    deliveredAt    || '',
    damageDescription,
    photoPath,
    labelOcr       ? 'Yes' : 'No',
    ocrTracking    || '',
    damageScore    || '',
    productMatch   || '',
    Array.isArray(hardBlocks) ? hardBlocks.join(' | ') : '',
    Array.isArray(softFlags)  ? softFlags.join(' | ')  : '',
    decision,
    decisionDate   || '',
    '',  // FedEx Claim # — filled later
    '',  // Notes
  ]);
}

async function updateClaimFedexRef(claimId, fedexClaimRef) {
  const found = await findRow('Claims', 0, claimId);
  if (found) {
    // Column W = index 22 = FedEx Claim #
    await updateCell('Claims', found.rowIndex, 'W', fedexClaimRef);
  }
}

async function updateClaimDecision(claimId, decision, notes = '') {
  const found = await findRow('Claims', 0, claimId);
  if (found) {
    await updateCell('Claims', found.rowIndex, 'U', decision);
    await updateCell('Claims', found.rowIndex, 'V', new Date().toISOString());
    if (notes) await updateCell('Claims', found.rowIndex, 'X', notes);
  }
}

async function saveCarrierClaim(data) {
  await appendRow('Carrier Claims', [
    data.claimId,
    data.fedexClaimRef,
    data.submittedDate || new Date().toISOString(),
    '',
    'Submitted',
    data.amountClaimed || '',
    '',
    '',
    '',
  ]);
}

async function updateCarrierClaimStatus(fedexClaimRef, status, amountReimbursed = '', paymentDate = '') {
  const found = await findRow('Carrier Claims', 1, fedexClaimRef);
  if (found) {
    await updateCell('Carrier Claims', found.rowIndex, 'D', new Date().toISOString());
    await updateCell('Carrier Claims', found.rowIndex, 'E', status);
    if (amountReimbursed) await updateCell('Carrier Claims', found.rowIndex, 'G', amountReimbursed);
    if (paymentDate)      await updateCell('Carrier Claims', found.rowIndex, 'H', paymentDate);
  }
}

async function upsertCustomer(email, name, decisionType) {
  const found = await findRow('Customers', 0, email);
  if (!found) {
    await appendRow('Customers', [
      email, name,
      1,
      decisionType === 'APPROVED' ? 1 : 0,
      decisionType === 'REJECTED' ? 1 : 0,
      decisionType === 'MANUAL_REVIEW' ? 1 : 0,
      new Date().toISOString(),
      0,
    ]);
  } else {
    const row     = found.row;
    const total   = (parseInt(row[2]) || 0) + 1;
    const approved= (parseInt(row[3]) || 0) + (decisionType === 'APPROVED' ? 1 : 0);
    const rejected= (parseInt(row[4]) || 0) + (decisionType === 'REJECTED' ? 1 : 0);
    const pending = (parseInt(row[5]) || 0) + (decisionType === 'MANUAL_REVIEW' ? 1 : 0);
    await updateCell('Customers', found.rowIndex, 'C', total);
    await updateCell('Customers', found.rowIndex, 'D', approved);
    await updateCell('Customers', found.rowIndex, 'E', rejected);
    await updateCell('Customers', found.rowIndex, 'F', pending);
    await updateCell('Customers', found.rowIndex, 'G', new Date().toISOString());
  }
}

async function getClaimHistory(email) {
  const found = await findRow('Customers', 0, email);
  if (!found) return { count: 0, approved: 0, rejected: 0 };
  const row = found.row;
  return {
    count:    parseInt(row[2]) || 0,
    approved: parseInt(row[3]) || 0,
    rejected: parseInt(row[4]) || 0,
  };
}

async function getAllClaims() {
  return getAllRows('Claims');
}

async function getAllCarrierClaims() {
  return getAllRows('Carrier Claims');
}

module.exports = {
  saveClaim,
  updateClaimFedexRef,
  updateClaimDecision,
  saveCarrierClaim,
  updateCarrierClaimStatus,
  upsertCustomer,
  getClaimHistory,
  getAllClaims,
  getAllCarrierClaims,
};
