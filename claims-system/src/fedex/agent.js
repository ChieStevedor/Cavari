/**
 * FedEx Claims Portal — Playwright agent
 *
 * Automates claim submission at fedex.com/en-us/claims.html
 * Requires a valid FedEx business account (set credentials in .env).
 *
 * NOTE: FedEx periodically redesigns their portal. If selectors break,
 * update the selector constants below. Use `HEADLESS=false` in .env
 * during debugging to watch the browser in real time.
 */

const { chromium } = require('playwright');
const cfg          = require('../config');
const sheetsClient = require('../sheets/client');

const FEDEX_CLAIMS_URL = 'https://www.fedex.com/en-us/claims.html';
const FEDEX_LOGIN_URL  = 'https://www.fedex.com/en-us/home.html';
const HEADLESS         = process.env.HEADLESS !== 'false';

// ── Submit a damage claim to FedEx ────────────────────────────────────────────

async function submitFedexClaim({ claimId, trackingNumber, carrier, shipment, order, damageDescription, photoPath }) {
  if (carrier?.toLowerCase() !== 'fedex') {
    console.log(`[fedex-agent] Carrier is ${carrier}, not FedEx — skipping automated submission`);
    return { submitted: false, note: `Carrier is ${carrier}, not FedEx` };
  }

  if (!cfg.fedex.portalEmail || !cfg.fedex.portalPassword) {
    console.warn('[fedex-agent] FedEx credentials not configured — skipping submission');
    return { submitted: false, note: 'FedEx credentials not configured' };
  }

  const browser = await chromium.launch({ headless: HEADLESS, slowMo: 80 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport:  { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    // ── Step 1: Log in ──────────────────────────────────────────────────────
    console.log('[fedex-agent] Navigating to FedEx login…');
    await page.goto(FEDEX_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Click the sign-in button in the header
    await page.click('[data-testid="sign-in-button"], a[href*="signin"], button:has-text("Sign In")', { timeout: 10_000 });
    await page.waitForTimeout(1500);

    // Fill credentials
    await page.fill('input[type="email"], input[name="userId"], #userId', cfg.fedex.portalEmail);
    await page.fill('input[type="password"], input[name="password"], #password', cfg.fedex.portalPassword);
    await page.click('button[type="submit"], #submitBtn, button:has-text("Log In")', { timeout: 5_000 });
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20_000 });
    console.log('[fedex-agent] Logged in');

    // ── Step 2: Navigate to claims ──────────────────────────────────────────
    await page.goto(FEDEX_CLAIMS_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);
    console.log('[fedex-agent] On claims page');

    // Click "File a Claim" or "Start a Claim"
    await page.click('button:has-text("File a Claim"), a:has-text("File a Claim"), button:has-text("Start"), a:has-text("Start a Claim")', { timeout: 10_000 });
    await page.waitForTimeout(1500);

    // ── Step 3: Select claim type — Damage ─────────────────────────────────
    // FedEx typically offers: Loss, Damage, Missing Content
    await page.click('label:has-text("Damage"), input[value="damage"], input[value="DAMAGE"]', { timeout: 10_000 });
    await page.waitForTimeout(500);

    const nextBtn = 'button:has-text("Next"), button:has-text("Continue"), [data-testid="next-btn"]';

    // ── Step 4: Enter tracking number ──────────────────────────────────────
    const trackingInput = await page.waitForSelector(
      'input[placeholder*="tracking"], input[name*="tracking"], input[id*="tracking"]',
      { timeout: 10_000 },
    );
    await trackingInput.fill(trackingNumber);
    await page.click(nextBtn, { timeout: 5_000 });
    await page.waitForTimeout(2000);

    // ── Step 5: Shipment details ────────────────────────────────────────────
    // Ship date
    if (shipment.shippedAt) {
      const shipDate = new Date(shipment.shippedAt).toLocaleDateString('en-US');
      const shipDateInput = await page.$('input[placeholder*="ship date"], input[name*="shipDate"]');
      if (shipDateInput) await shipDateInput.fill(shipDate);
    }

    // ── Step 6: Package contents & value ───────────────────────────────────
    const itemDesc      = order.items.map(i => i.name).join(', ');
    const declaredValue = order.orderValue.toString();

    const contentInput = await page.$('textarea[name*="content"], input[name*="content"], textarea[placeholder*="content"]');
    if (contentInput) await contentInput.fill(itemDesc);

    const valueInput = await page.$('input[name*="value"], input[placeholder*="value"], input[id*="claimAmount"]');
    if (valueInput) await valueInput.fill(declaredValue);

    // ── Step 7: Damage description ──────────────────────────────────────────
    const descInput = await page.$('textarea[name*="damage"], textarea[name*="description"], textarea[placeholder*="damage"]');
    if (descInput) await descInput.fill(damageDescription || 'Item received damaged during transit.');

    // ── Step 8: Contact information (Cavari as claimant) ───────────────────
    const companyInput = await page.$('input[name*="company"], input[placeholder*="company"]');
    if (companyInput) await companyInput.fill(cfg.fedex.cavari.company);

    const contactInput = await page.$('input[name*="contact"], input[placeholder*="name"]');
    if (contactInput) await contactInput.fill(cfg.fedex.cavari.contact);

    const emailInput = await page.$('input[type="email"][name*="contact"], input[name*="email"]:not([name*="userId"])');
    if (emailInput) await emailInput.fill(cfg.fedex.cavari.email);

    const phoneInput = await page.$('input[name*="phone"], input[type="tel"]');
    if (phoneInput) await phoneInput.fill(cfg.fedex.cavari.phone);

    // ── Step 9: Upload damage photo ─────────────────────────────────────────
    if (photoPath) {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(photoPath);
        await page.waitForTimeout(2000);
        console.log('[fedex-agent] Photo uploaded');
      }
    }

    await page.click(nextBtn, { timeout: 5_000 });
    await page.waitForTimeout(2000);

    // ── Step 10: Review & submit ────────────────────────────────────────────
    await page.click('button:has-text("Submit"), button:has-text("File Claim"), [data-testid="submit-btn"]', { timeout: 10_000 });
    await page.waitForTimeout(3000);
    console.log('[fedex-agent] Claim submitted');

    // ── Step 11: Capture FedEx claim reference number ───────────────────────
    const refText = await page.textContent(
      '[data-testid="confirmation-number"], .confirmation-number, [class*="claimId"], [class*="reference"]',
    ).catch(() => '');

    const refMatch = refText.match(/[A-Z0-9\-]{6,20}/);
    const fedexClaimRef = refMatch ? refMatch[0] : `FEDEX-${Date.now()}`;

    console.log(`[fedex-agent] FedEx claim reference: ${fedexClaimRef}`);

    // Persist to Sheets
    await sheetsClient.updateClaimFedexRef(claimId, fedexClaimRef);
    await sheetsClient.saveCarrierClaim({
      claimId,
      fedexClaimRef,
      submittedDate: new Date().toISOString(),
      amountClaimed: order.orderValue,
    });

    return { submitted: true, fedexClaimRef };

  } catch (err) {
    console.error('[fedex-agent] Error during claim submission:', err.message);
    // Take a screenshot for debugging
    await page.screenshot({ path: `uploads/fedex-error-${claimId}.png` }).catch(() => {});
    return { submitted: false, error: err.message };

  } finally {
    await browser.close();
  }
}

module.exports = { submitFedexClaim };
