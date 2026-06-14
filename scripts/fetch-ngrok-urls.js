const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || path.resolve(__dirname, '..');
const outFile = path.join(root, '.env.ngrok');

function fetchTunnels() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.tunnels || []);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    // Poll for a short while until tunnels appear
    let tunnels = [];
    const deadline = Date.now() + 15000; // 15s
    while (Date.now() < deadline) {
      try {
        tunnels = await fetchTunnels();
      } catch (err) {
        tunnels = [];
      }
      if (tunnels.length >= 1) break;
      await new Promise(r => setTimeout(r, 500));
    }

    // attempt to find backend/frontend tunnels
    const backend = tunnels.find(t => t.config && String(t.config.addr).includes(':5000')) || tunnels[0];
    const frontend = tunnels.find(t => t.config && String(t.config.addr).includes(':3000')) || tunnels[1] || backend;

    if (!backend) throw new Error('No ngrok tunnels found on local API (127.0.0.1:4040).');

    const serverUrl = backend.public_url.replace(/^http:/, 'https:');
    const clientUrl = frontend.public_url.replace(/^http:/, 'https:');

    const contents = `SERVER_URL=${serverUrl}\nCLIENT_URL=${clientUrl}\n`;
    fs.writeFileSync(outFile, contents, { encoding: 'utf8' });
    console.log('WROTE', outFile);
    console.log(contents);
  } catch (err) {
    console.error('Failed to fetch ngrok tunnels:', err.message || err);
    process.exit(1);
  }
})();
