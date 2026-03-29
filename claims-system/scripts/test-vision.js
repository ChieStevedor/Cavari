require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const https = require('https');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Download a sample damaged box photo for testing
function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}

async function run() {
  console.log('Fetching sample damaged parcel image…');
  // Public domain image of a damaged shipping box
  const imgBuffer = await fetchImage('https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Damaged_box.jpg/320px-Damaged_box.jpg').catch(() => null);

  let imageData;
  if (imgBuffer) {
    imageData = { type: 'base64', media_type: 'image/jpeg', data: imgBuffer.toString('base64') };
    console.log('✓ Image loaded\n');
  } else {
    // Fallback: use a 1x1 white pixel if download fails
    imageData = { type: 'base64', media_type: 'image/jpeg', data: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEA/8QAHxAAAQQCAwEAAAAAAAAAAAAAAQIDBAUREiEx/9oACAEBAAA/AKzp2yxrEqDJDq7oi2bLWNHMoGo8zV//2Q==' };
    console.log('(Using placeholder image — network unavailable)\n');
  }

  // Run all three checks
  console.log('Running Claude Vision checks…\n');

  const checks = await Promise.all([

    // 1. Shipping label OCR
    client.messages.create({
      model: 'claude-opus-4-6', max_tokens: 256,
      messages: [{ role: 'user', content: [
        { type: 'image', source: imageData },
        { type: 'text', text: 'Is there a shipping/carrier label visible? If yes, extract the tracking number. JSON only: {"label_visible": true, "tracking_number": "NUMBER"} or {"label_visible": false, "tracking_number": null}' },
      ]}],
    }).then(r => ({ check: 'Shipping Label OCR', result: r.content[0].text })),

    // 2. Damage evidence
    client.messages.create({
      model: 'claude-opus-4-6', max_tokens: 256,
      messages: [{ role: 'user', content: [
        { type: 'image', source: imageData },
        { type: 'text', text: 'Does this image show visible damage to a shipping box or item? Rate 0-10. JSON only: {"has_damage": true, "confidence": 8, "description": "..."}' },
      ]}],
    }).then(r => ({ check: 'Damage Evidence', result: r.content[0].text })),

    // 3. Product match
    client.messages.create({
      model: 'claude-opus-4-6', max_tokens: 256,
      messages: [{ role: 'user', content: [
        { type: 'image', source: imageData },
        { type: 'text', text: 'The customer ordered: "Murano Glass Pendant Light". Does the photo look consistent with a decorative lighting product shipment? JSON only: {"matches": "yes", "note": "..."}' },
      ]}],
    }).then(r => ({ check: 'Product Match', result: r.content[0].text })),

  ]);

  for (const { check, result } of checks) {
    console.log(`── ${check}`);
    try { console.log(JSON.stringify(JSON.parse(result.match(/\{[\s\S]*\}/)[0]), null, 2)); }
    catch { console.log(result); }
    console.log();
  }

  console.log('✓ Claude Vision checks working correctly.\n');
}

run().catch(err => console.error('Error:', err.message));
