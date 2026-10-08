// Fails when a separator dot (middle dot or bullet, as a character, escape or entity) appears under src/.
// The founder does not want dotted separators anywhere a person can see them. Separate values with hierarchy
// (gap, weight, colour, position) instead. A line that must keep one (a parser for incoming text) carries an
// `allow-dot` comment.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const srcDir = join(root, 'src');
const EXT = /\.(jsx?|tsx?|mjs|cjs|css|scss|html|json|md|mdx)$/;
const DOT = /·|•|&middot;|&bull;|&#183;|&#xb7;|&#8226;|&#x2022;|\\u00b7|\\u2022|\\u\{b7\}|\\u\{2022\}|\\xb7/i;

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXT.test(name)) files.push(p);
  }
})(srcDir);

let bad = 0;
for (const file of files) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (DOT.test(line) && !line.includes('allow-dot')) {
      bad += 1;
      console.error(`${relative(root, file)}:${i + 1}: ${line.trim().slice(0, 140)}`);
    }
  });
}
if (bad) {
  console.error(`\n${bad} separator dot(s) found. Use hierarchy instead, or mark a parser line with "allow-dot".`);
  process.exit(1);
}
console.log('No separator dots under src/.');
