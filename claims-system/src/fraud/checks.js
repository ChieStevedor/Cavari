const Anthropic = require('@anthropic-ai/sdk');
const cfg = require('../config');

const client = new Anthropic({ apiKey: cfg.anthropic.apiKey });

// ── Shared Vision helper ──────────────────────────────────────────────────────

function detectMimeType(buffer) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp';
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';
  return 'image/jpeg'; // fallback
}

async function askClaude(prompt, imageBuffer) {
  const base64    = imageBuffer.toString('base64');
  const mediaType = detectMimeType(imageBuffer);
  const msg = await client.messages.create({
    model:      'claude-opus-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: prompt },
      ],
    }],
  });
  return msg.content[0].text.trim();
}

// ── Check 1: Shipping label OCR ───────────────────────────────────────────────
// Returns { found: bool, trackingNumber: string|null, raw: string }

async function checkShippingLabel(imageBuffer) {
  const raw = await askClaude(
    `Look at this image carefully. Is there a shipping/carrier label visible on a box or package?
If yes, extract the tracking number (usually a long barcode number like 1Z..., 7489..., 9400..., etc.).
Respond in this exact JSON format with no extra text:
{"label_visible": true, "tracking_number": "EXTRACTED_NUMBER"}
or if no label:
{"label_visible": false, "tracking_number": null}`,
    imageBuffer,
  );

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      found:          parsed.label_visible === true,
      trackingNumber: parsed.tracking_number || null,
      raw,
    };
  } catch {
    return { found: false, trackingNumber: null, raw };
  }
}

// ── Check 2: Damage evidence ──────────────────────────────────────────────────
// Returns { hasDamage: bool, confidence: 0-10, description: string }

async function checkDamageEvidence(imageBuffer) {
  const raw = await askClaude(
    `Look at this image. Does it show visible damage to a shipping box, package, or the item inside?
Damage includes: crushed/dented/torn packaging, broken items, shattered glass, bent metal, water damage, etc.
Rate your confidence that genuine damage is visible on a scale of 0 to 10 (10 = unmistakable damage).
Respond in this exact JSON format with no extra text:
{"has_damage": true, "confidence": 8, "description": "Box is heavily crushed on the left side with contents spilling out"}`,
    imageBuffer,
  );

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      hasDamage:   parsed.has_damage === true,
      confidence:  typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      description: parsed.description || '',
      raw,
    };
  } catch {
    return { hasDamage: false, confidence: 0, description: '', raw };
  }
}

// ── Check 3: Product match ────────────────────────────────────────────────────
// Returns { matches: 'yes'|'no'|'uncertain', note: string }

async function checkProductMatch(imageBuffer, orderedItems) {
  const itemList = orderedItems.map(i => `- ${i.name} (qty: ${i.quantity})`).join('\n');
  const raw = await askClaude(
    `Look at this image of a damaged package or item.
The customer ordered the following products from a decorative lighting company:
${itemList}

Does the item or packaging visible in the photo appear consistent with this type of product?
Consider: a lighting product would typically be in a large box with foam/bubble wrap; you might see parts of a light fixture, lamp shade, glass, metal components, etc.
Respond with one of: "yes", "no", or "uncertain", and a brief note.
JSON format only:
{"matches": "yes", "note": "Box size and foam packaging consistent with a light fixture"}`,
    imageBuffer,
  );

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      matches: parsed.matches || 'uncertain',
      note:    parsed.note    || '',
      raw,
    };
  } catch {
    return { matches: 'uncertain', note: '', raw };
  }
}

// ── Check 4: Time window ──────────────────────────────────────────────────────

function checkTimeWindow(deliveredAt, claimWindowHours) {
  if (!deliveredAt) {
    // Delivery not confirmed yet — can't verify window, soft flag
    return { withinWindow: null, hoursElapsed: null, note: 'Delivery not yet confirmed by carrier.' };
  }
  const delivered     = new Date(deliveredAt);
  const now           = new Date();
  const hoursElapsed  = (now - delivered) / (1000 * 60 * 60);
  const withinWindow  = hoursElapsed <= claimWindowHours;
  return {
    withinWindow,
    hoursElapsed: Math.round(hoursElapsed),
    note: withinWindow
      ? `${Math.round(hoursElapsed)}h after delivery (within ${claimWindowHours}h window)`
      : `${Math.round(hoursElapsed)}h after delivery — exceeds ${claimWindowHours}h window`,
  };
}

// ── Check 5: Tracking number match ───────────────────────────────────────────

function checkTrackingMatch(ocrTracking, shopifyTracking) {
  if (!ocrTracking || !shopifyTracking) {
    return { match: null, note: 'Could not compare — one or both tracking numbers missing.' };
  }
  // Normalize: remove spaces/dashes, uppercase
  const normalize = t => t.replace(/[\s\-]/g, '').toUpperCase();
  const match     = normalize(ocrTracking) === normalize(shopifyTracking);
  return {
    match,
    note: match
      ? `OCR tracking ${ocrTracking} matches order tracking ${shopifyTracking}`
      : `OCR tracking ${ocrTracking} does NOT match order tracking ${shopifyTracking}`,
  };
}

module.exports = {
  checkShippingLabel,
  checkDamageEvidence,
  checkProductMatch,
  checkTimeWindow,
  checkTrackingMatch,
};
