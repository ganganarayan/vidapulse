'use strict';
/**
 * Lightweight syntax/load check for the backend (no TypeScript in this repo).
 * Runs `node --check` on every .js file under src/ so a broken file is caught
 * before commit/deploy. Cross-platform (used by `npm run verify`).
 */
const { execFileSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js')) files.push(p);
  }
})(SRC);

let failed = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (err) {
    failed++;
    console.error('✗', path.relative(path.join(__dirname, '..'), f));
    console.error((err.stderr || err.message || '').toString().trim());
  }
}

if (failed) {
  console.error(`\n[check] ${failed} file(s) failed syntax check`);
  process.exit(1);
}
console.log(`[check] ✓ ${files.length} backend files OK`);
