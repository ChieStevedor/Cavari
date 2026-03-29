require('dotenv').config();
const { google } = require('googleapis');
const http = require('http');
const url  = require('url');
const fs   = require('fs');
const path = require('path');

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
);

const authUrl = auth.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
  prompt: 'consent',
});

const server = http.createServer(async (req, res) => {
  const { pathname, query } = url.parse(req.url, true);
  if (pathname !== '/oauth/callback') return;
  if (!query.code) { res.end('No code.'); server.close(); return; }
  try {
    const { tokens } = await auth.getToken(query.code);
    const envPath = path.resolve(__dirname, '../.env');
    let env = fs.readFileSync(envPath, 'utf-8');
    env = env
      .replace(/^GOOGLE_ACCESS_TOKEN=.*/m,  'GOOGLE_ACCESS_TOKEN='  + tokens.access_token)
      .replace(/^GOOGLE_REFRESH_TOKEN=.*/m, 'GOOGLE_REFRESH_TOKEN=' + (tokens.refresh_token || ''));
    fs.writeFileSync(envPath, env);
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end('<html><body style="background:#0F0F0F;color:#C6A87D;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h2>Authentication successful — close this tab.</h2></body></html>');
    console.log('\n✓ Tokens saved to .env — authentication complete.\n');
    console.log('Next: node scripts/setup-sheets.js\n');
    server.close();
  } catch (e) { res.end('Error: ' + e.message); server.close(); }
});

server.listen(3000, () => {
  console.log('\nOpening browser — sign in with your CAVARI business Gmail…\n');
  require('child_process').execSync('open "' + authUrl + '"');
});
