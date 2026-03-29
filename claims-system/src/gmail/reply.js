const { google } = require('googleapis');
const cfg = require('../config');

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

function encodeEmail({ to, subject, body }) {
  const raw = [
    `From: ${cfg.gmail.claimsEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    body,
  ].join('\r\n');

  return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendReply({ to, subject, body }) {
  const auth  = buildAuth();
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodeEmail({ to, subject, body }) },
  });
}

// ── Email templates ──────────────────────────────────────────────────────────

function approvedEmail({ claimId, customerName }) {
  return {
    subject: `Your damage claim has been approved — ${claimId}`,
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { background:#0F0F0F; color:#F5F3EF; font-family:'Helvetica Neue',Arial,sans-serif; font-weight:300; margin:0; padding:0; }
    .wrap { max-width:560px; margin:0 auto; padding:48px 32px; }
    .logo { font-size:1.2rem; letter-spacing:.2em; color:#C6A87D; margin-bottom:40px; }
    h1 { font-size:1.4rem; font-weight:400; margin-bottom:16px; }
    p { color:#8A8A8A; line-height:1.8; font-size:.92rem; margin-bottom:16px; }
    .claim-id { display:inline-block; border:1px solid rgba(198,168,125,.4); padding:8px 18px; color:#C6A87D; letter-spacing:.1em; font-size:.9rem; margin:16px 0 24px; }
    .divider { border:none; border-top:1px solid rgba(198,168,125,.15); margin:32px 0; }
    .footer { font-size:.75rem; color:#555; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">CAVARI</div>
    <h1>Your claim has been approved.</h1>
    <p>Hello${customerName ? ' ' + customerName : ''},</p>
    <p>We have reviewed your damage report and approved your claim. To receive a <strong style="color:#F5F3EF;">replacement or refund</strong>, please return the damaged item to us using the address below.</p>
    <div class="claim-id">${claimId}</div>
    <p><strong style="color:#F5F3EF;">Return address:</strong><br/>
    ${cfg.fedex.cavari.company}<br/>
    ${cfg.fedex.cavari.address}</p>
    <p>Once we receive and inspect the item, your replacement or refund will be processed promptly. Please reply to this email with your return tracking number.</p>
    <hr class="divider"/>
    <p class="footer">CAVARI — Curated Decorative Lighting for North America<br/>
    Questions? Reply to this email.</p>
  </div>
</body>
</html>`,
  };
}

function rejectedEmail({ claimId, customerName, reason }) {
  return {
    subject: `Regarding your damage claim — ${claimId}`,
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { background:#0F0F0F; color:#F5F3EF; font-family:'Helvetica Neue',Arial,sans-serif; font-weight:300; margin:0; padding:0; }
    .wrap { max-width:560px; margin:0 auto; padding:48px 32px; }
    .logo { font-size:1.2rem; letter-spacing:.2em; color:#C6A87D; margin-bottom:40px; }
    h1 { font-size:1.4rem; font-weight:400; margin-bottom:16px; }
    p { color:#8A8A8A; line-height:1.8; font-size:.92rem; margin-bottom:16px; }
    .claim-id { display:inline-block; border:1px solid rgba(198,168,125,.4); padding:8px 18px; color:#C6A87D; letter-spacing:.1em; font-size:.9rem; margin:16px 0 24px; }
    .reason-box { border-left:2px solid #C6A87D; padding:12px 18px; margin:20px 0; color:#F5F3EF; font-size:.88rem; }
    .divider { border:none; border-top:1px solid rgba(198,168,125,.15); margin:32px 0; }
    .footer { font-size:.75rem; color:#555; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">CAVARI</div>
    <h1>We were unable to approve your claim.</h1>
    <p>Hello${customerName ? ' ' + customerName : ''},</p>
    <p>After reviewing your damage report, we were unable to approve it at this time.</p>
    <div class="claim-id">${claimId}</div>
    <div class="reason-box">${reason || 'The submission did not meet our claims requirements.'}</div>
    <p>If you believe this decision is incorrect or would like to provide additional information, please reply to this email and our team will review your case manually.</p>
    <hr class="divider"/>
    <p class="footer">CAVARI — Curated Decorative Lighting for North America<br/>
    Questions? Reply to this email.</p>
  </div>
</body>
</html>`,
  };
}

async function notifyApproved({ to, claimId, customerName }) {
  const tpl = approvedEmail({ claimId, customerName });
  await sendReply({ to, ...tpl });
}

async function notifyRejected({ to, claimId, customerName, reason }) {
  const tpl = rejectedEmail({ claimId, customerName, reason });
  await sendReply({ to, ...tpl });
}

module.exports = { notifyApproved, notifyRejected };
