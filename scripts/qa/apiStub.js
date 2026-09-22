/**
 * Stands in for the backend during the WEB-1 SSR check.
 *
 * The payload is the real one, captured from https://dev.pxispace.com with curl — Cloudflare
 * refuses Node's fetch from this machine, so a Next build here cannot reach the API directly
 * and every city would look empty for the wrong reason. Serving the same bytes locally lets
 * the page's own branching be tested against real data.
 *
 *   node apiStub.js <port> [--empty|--down]
 */
const http = require('http');
const fs = require('fs');

const port = Number(process.argv[2] || 4310);
const mode = process.argv[3] || '';
const payload = JSON.parse(fs.readFileSync(`${process.env.PXI_QA_DIR || __dirname}/discover-payload.json`, 'utf8'));

http
    .createServer((req, res) => {
        if (mode === '--down') {
            res.writeHead(503, { 'content-type': 'application/json' });
            return res.end('{"error":"upstream down"}');
        }
        const events = mode === '--empty' ? [] : payload.events || payload;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ events, total: events.length }));
    })
    .listen(port, () => console.log(`stub on ${port} ${mode}`));
