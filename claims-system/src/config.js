require('dotenv').config();

module.exports = {
  google: {
    clientId:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
    accessToken:  process.env.GOOGLE_ACCESS_TOKEN,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
  gmail: {
    claimsEmail:  process.env.CLAIMS_EMAIL || 'claims@cavari.com',
    pollInterval: parseInt(process.env.GMAIL_POLL_INTERVAL) || 120_000,
  },
  sheets: {
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    tabs: {
      claims:       'Claims',
      carrierClaims:'Carrier Claims',
      customers:    'Customers',
    },
  },
  shopify: {
    domain:      process.env.SHOPIFY_STORE_DOMAIN,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  fedex: {
    portalEmail:   process.env.FEDEX_PORTAL_EMAIL,
    portalPassword:process.env.FEDEX_PORTAL_PASSWORD,
    accountNumber: process.env.FEDEX_ACCOUNT_NUMBER,
    cavari: {
      company: process.env.CAVARI_COMPANY_NAME  || 'Cavari',
      contact: process.env.CAVARI_CONTACT_NAME  || '',
      email:   process.env.CAVARI_CONTACT_EMAIL || '',
      phone:   process.env.CAVARI_CONTACT_PHONE || '',
      address: process.env.CAVARI_ADDRESS       || '',
    },
  },
  rules: {
    claimWindowHours:      parseInt(process.env.CLAIM_WINDOW_HOURS)      || 72,
    autoApproveThreshold:  parseFloat(process.env.AUTO_APPROVE_THRESHOLD) || 300,
  },
  server: {
    port:    parseInt(process.env.PORT) || 3000,
    env:     process.env.NODE_ENV || 'development',
  },
};
