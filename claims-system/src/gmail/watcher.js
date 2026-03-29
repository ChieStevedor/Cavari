const { google } = require('googleapis');
const path  = require('path');
const fs    = require('fs');
const cfg   = require('../config');

// ── Auth ─────────────────────────────────────────────────────────────────────

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

// ── Message helpers ──────────────────────────────────────────────────────────

function decodeBase64(data) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function extractBody(payload) {
  const parts = payload.parts || [payload];
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return decodeBase64(part.body.data).toString('utf-8').trim();
    }
    if (part.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
  return '';
}

async function downloadAttachment(gmail, userId, messageId, attachmentId, filename) {
  const res = await gmail.users.messages.attachments.get({
    userId, messageId, id: attachmentId,
  });
  const buffer = decodeBase64(res.data.data);
  const uploadDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const ext      = path.extname(filename) || '.jpg';
  const saveName = `${messageId}${ext}`;
  const savePath = path.join(uploadDir, saveName);
  fs.writeFileSync(savePath, buffer);
  return { savePath, buffer };
}

function extractAttachments(payload) {
  const attachments = [];
  const parts = payload.parts || [];
  for (const part of parts) {
    if (part.mimeType?.startsWith('image/') && part.body?.attachmentId) {
      attachments.push({ attachmentId: part.body.attachmentId, filename: part.filename || 'photo.jpg' });
    }
    if (part.parts) attachments.push(...extractAttachments(part));
  }
  return attachments;
}

// ── Core watcher ─────────────────────────────────────────────────────────────

// Track processed message IDs in memory (survives restarts via Sheets log instead)
const processed = new Set();

async function fetchNewClaims() {
  const auth  = buildAuth();
  const gmail = google.gmail({ version: 'v1', auth });

  // Search for unread emails sent to the claims inbox
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `to:${cfg.gmail.claimsEmail} is:unread`,
    maxResults: 20,
  });

  const messages = listRes.data.messages || [];
  const claims   = [];

  for (const msg of messages) {
    if (processed.has(msg.id)) continue;

    const full = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
    const payload  = full.data.payload;
    const headers  = payload.headers || [];

    const fromHeader    = headers.find(h => h.name === 'From')?.value  || '';
    const subjectHeader = headers.find(h => h.name === 'Subject')?.value || '';
    const dateHeader    = headers.find(h => h.name === 'Date')?.value   || '';

    // Extract sender email
    const emailMatch = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([^\s]+@[^\s]+)/);
    const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : fromHeader.toLowerCase();

    // Extract text body
    const bodyText = extractBody(payload);

    // Extract image attachments
    const attachmentMeta = extractAttachments(payload);
    const photos = [];
    for (const att of attachmentMeta) {
      const { savePath, buffer } = await downloadAttachment(gmail, 'me', msg.id, att.attachmentId, att.filename);
      photos.push({ path: savePath, buffer, filename: att.filename });
    }

    // Mark as read
    await gmail.users.messages.modify({
      userId: 'me', id: msg.id,
      requestBody: { removeLabelIds: ['UNREAD'] },
    });

    processed.add(msg.id);

    claims.push({
      gmailMessageId: msg.id,
      senderEmail,
      subject:        subjectHeader,
      receivedAt:     dateHeader,
      message:        bodyText,
      photos,
    });
  }

  return claims;
}

module.exports = { fetchNewClaims };
