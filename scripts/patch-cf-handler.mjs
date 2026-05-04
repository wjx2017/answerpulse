/**
 * Patch OpenNext's handler.mjs for Cloudflare Workers compatibility.
 * 
 * CF Workers don't support certain Node.js / browser globals:
 * - FinalizationRegistry (used by undici's request.js for AbortController cleanup)
 * - MessagePort (used by undici's webidl, already patched with try/catch)
 * 
 * This script injects polyfills at the TOP of handler.mjs.
 * Must be run AFTER `npx @opennextjs/cloudflare build` and BEFORE `wrangler deploy`.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;
const HANDLER_PATH = join(PROJECT_ROOT, '.open-next', 'server-functions', 'default', 'handler.mjs');

const POLYFILL_BANNER = `
// === Cloudflare Workers Polyfills (patched by scripts/patch-cf-handler.mjs) ===
if (typeof globalThis.FinalizationRegistry === "undefined") {
  globalThis.FinalizationRegistry = class FinalizationRegistry {
    constructor() {}
    register() {}
    unregister() {}
  };
}
// === End Polyfills ===

`;

try {
  let content = readFileSync(HANDLER_PATH, 'utf-8');
  
  // Check if already patched
  if (content.includes('Cloudflare Workers Polyfills')) {
    console.log('handler.mjs already patched, skipping.');
    process.exit(0);
  }
  
  // Insert polyfill at the very beginning
  content = POLYFILL_BANNER + content;
  
  writeFileSync(HANDLER_PATH, content, 'utf-8');
  console.log('handler.mjs patched successfully with FinalizationRegistry polyfill.');
} catch (err) {
  console.error('Failed to patch handler.mjs:', err.message);
  process.exit(1);
}
