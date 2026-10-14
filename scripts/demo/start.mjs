// npm run demo: the mock API on :3199 and the site on :5180 reading from it. Open http://localhost:5180/u/afrodisiac
import { spawn } from 'node:child_process';

const api = 'http://localhost:' + (process.env.DEMO_API_PORT || 3199);
// Report-only CSP: the browser may then call the mock API on :3199 (production's policy is untouched).
const env = { ...process.env, API_BASE_URL: api, NEXT_PUBLIC_API_BASE_URL: api, CSP_REPORT_ONLY: '1' };
const run = (cmd, args) => spawn(cmd, args, { stdio: 'inherit', env });
const children = [run('node', ['scripts/demo/mock-api.mjs']), run('npx', ['next', 'dev', '-p', '5180'])];
for (const c of children) c.on('exit', () => children.forEach((o) => o.kill()));
process.on('SIGINT', () => children.forEach((c) => c.kill()));
