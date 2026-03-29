/**
 * FedEx Reimbursement Tracker
 *
 * Runs on a daily schedule. For every open carrier claim in Google Sheets,
 * it logs into the FedEx claims portal, checks the current status,
 * and updates the Carrier Claims sheet accordingly.
 *
 * Status progression: Submitted → Under Review → Approved / Denied → Paid
 */

const { chromium } = require('playwright');
const cfg          = require('../config');
const sheetsClient = require('../sheets/client');

const FEDEX_CLAIMS_STATUS_URL = 'https://www.fedex.com/en-us/claims.html';
const HEADLESS = process.env.HEADLESS !== 'false';

const OPEN_STATUSES = ['Submitted', 'Under Review', 'In Review', 'Processing'];

async function checkClaimStatus(page, fedexClaimRef) {
  await page.goto(FEDEX_CLAIMS_STATUS_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(1500);

  // Navigate to "Check Claim Status" tab/link
  await page.click(
    'a:has-text("Check Status"), button:has-text("Check Claim Status"), [data-testid="check-status"]',
    { timeout: 10_000 },
  );
  await page.waitForTimeout(1500);

  // Enter the FedEx claim reference number
  const input = await page.waitForSelector(
    'input[placeholder*="claim"], input[name*="claim"], input[id*="claim"]',
    { timeout: 10_000 },
  );
  await input.fill(fedexClaimRef);
  await page.click('button:has-text("Search"), button[type="submit"], button:has-text("Check")', { timeout: 5_000 });
  await page.waitForTimeout(2500);

  // Scrape status and reimbursement amount
  const statusText = await page.textContent(
    '[data-testid="claim-status"], .claim-status, [class*="status"]',
  ).catch(() => '');

  const amountText = await page.textContent(
    '[data-testid="approved-amount"], .approved-amount, [class*="amount"]',
  ).catch(() => '');

  const amount = amountText.match(/[\d,]+\.?\d*/)?.[0]?.replace(/,/g, '') || '';

  // Determine normalized status
  let status = 'Under Review';
  const lower = statusText.toLowerCase();
  if (lower.includes('approved') || lower.includes('settled'))  status = 'Approved';
  if (lower.includes('denied')   || lower.includes('rejected')) status = 'Denied';
  if (lower.includes('paid')     || lower.includes('payment'))  status = 'Paid';
  if (lower.includes('submitted'))                              status = 'Submitted';

  return { status, amountReimbursed: amount, rawText: statusText };
}

async function runReimbursementTracker() {
  console.log('[tracker] Starting daily reimbursement check…');

  const carrierClaims = await sheetsClient.getAllCarrierClaims();
  const openClaims    = carrierClaims.filter(row => OPEN_STATUSES.includes(row['Status']));

  if (openClaims.length === 0) {
    console.log('[tracker] No open carrier claims to check.');
    return;
  }

  if (!cfg.fedex.portalEmail || !cfg.fedex.portalPassword) {
    console.warn('[tracker] FedEx credentials not configured — skipping tracker run');
    return;
  }

  const browser = await chromium.launch({ headless: HEADLESS, slowMo: 60 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page    = await context.newPage();

  try {
    // ── Log in once, then check all open claims ───────────────────────────
    await page.goto('https://www.fedex.com/en-us/home.html', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);
    await page.click('[data-testid="sign-in-button"], a[href*="signin"], button:has-text("Sign In")', { timeout: 10_000 });
    await page.waitForTimeout(1500);
    await page.fill('input[type="email"], input[name="userId"], #userId', cfg.fedex.portalEmail);
    await page.fill('input[type="password"], input[name="password"], #password', cfg.fedex.portalPassword);
    await page.click('button[type="submit"], #submitBtn, button:has-text("Log In")', { timeout: 5_000 });
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20_000 });

    for (const claim of openClaims) {
      const ref = claim['FedEx Claim #'];
      if (!ref) continue;

      try {
        const result = await checkClaimStatus(page, ref);
        console.log(`[tracker] ${ref} → ${result.status}${result.amountReimbursed ? ' | $' + result.amountReimbursed : ''}`);

        const paymentDate = result.status === 'Paid' ? new Date().toISOString() : '';
        await sheetsClient.updateCarrierClaimStatus(
          ref, result.status, result.amountReimbursed, paymentDate,
        );
      } catch (err) {
        console.error(`[tracker] Failed to check ${ref}:`, err.message);
      }
    }

  } finally {
    await browser.close();
  }

  console.log(`[tracker] Done. Checked ${openClaims.length} claim(s).`);
}

module.exports = { runReimbursementTracker };
