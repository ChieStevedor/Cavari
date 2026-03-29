require('dotenv').config();
const { google } = require('googleapis');
const fs   = require('fs');
const path = require('path');

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);
auth.setCredentials({
  access_token:  process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sheets = google.sheets({ version: 'v4', auth });

const TABS = [
  {
    title: 'Claims',
    headers: [
      'Claim ID','Date Received','Customer Email','Customer Name',
      'Order #','Order Value','Currency','Items',
      'Carrier','Tracking #','Shipped At','Delivered At',
      'Damage Description','Photo Path',
      'Label OCR','OCR Tracking','Damage Score','Product Match',
      'Hard Blocks','Soft Flags',
      'Decision','Decision Date','FedEx Claim #','Notes',
    ],
  },
  {
    title: 'Carrier Claims',
    headers: [
      'Claim ID','FedEx Claim #','Submitted Date','Last Checked',
      'Status','Amount Claimed','Amount Reimbursed','Payment Date','Notes',
    ],
  },
  {
    title: 'Customers',
    headers: [
      'Email','Name','Total Claims','Approved','Rejected',
      'Pending','Last Claim Date','Fraud Score',
    ],
  },
];

async function run() {
  console.log('Creating Google Spreadsheet…');

  // Create spreadsheet with all three tabs
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'Cavari — Claims Database' },
      sheets: TABS.map((t, i) => ({
        properties: { sheetId: i, title: t.title, index: i },
      })),
    },
  });

  const spreadsheetId = res.data.spreadsheetId;
  const spreadsheetUrl = res.data.spreadsheetUrl;
  console.log('✓ Spreadsheet created:', spreadsheetUrl);

  // Write headers to each tab
  for (const tab of TABS) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab.title}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [tab.headers] },
    });

    // Bold + freeze the header row
    const sheetId = TABS.indexOf(tab);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.11, green: 0.11, blue: 0.11 } } },
              fields: 'userEnteredFormat(textFormat,backgroundColor)',
            },
          },
          {
            updateSheetProperties: {
              properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      },
    });
    console.log(`✓ Tab "${tab.title}" ready`);
  }

  // Save spreadsheet ID to .env
  const envPath = path.resolve(__dirname, '../.env');
  let env = fs.readFileSync(envPath, 'utf-8');
  env = env.replace(/^GOOGLE_SPREADSHEET_ID=.*/m, `GOOGLE_SPREADSHEET_ID=${spreadsheetId}`);
  fs.writeFileSync(envPath, env);

  console.log('\n✓ Spreadsheet ID saved to .env');
  console.log('\nOpen your sheet here:');
  console.log(spreadsheetUrl);
  console.log('\nNext: npm start\n');
}

run().catch(err => {
  console.error('Error:', err.message);
  if (err.message.includes('invalid_grant')) {
    console.error('Token expired — run: node scripts/auth.js');
  }
});
