# AnswerPulse Cloudflare API Routes 500 Error - Fix Report

**Date**: 2026-04-22

## Problem
After deploying AnswerPulse to Cloudflare Workers, the `/api/analyze` endpoint returned 500 errors while static pages worked fine.

## Root Cause
The actual error was **`ReferenceError: FinalizationRegistry is not defined`** (not `MessagePort` as initially suspected).

When the `/api/analyze` route loads `cheerio` (v1.2.0), it transitively imports `undici` (a fetch implementation). Undici's `lib/web/fetch/request.js` uses `FinalizationRegistry` at module load time to manage AbortController cleanup:

```js
const requestFinalizer = new FinalizationRegistry(({signal, abort}) => {
  signal.removeEventListener('abort', abort);
});
```

Cloudflare Workers does not support `FinalizationRegistry`, causing an immediate crash when the module is evaluated.

> Note: The `MessagePort` issue in `undici/lib/web/webidl/index.js` was already patched with a try/catch in the bundled output.

## Solution
Added a **no-op polyfill** for `FinalizationRegistry` at the top of the bundled `handler.mjs` file, injected after the OpenNext build and before deployment.

### Files Created
- `scripts/patch-cf-handler.mjs` - Post-build script that injects the polyfill

### Files Modified
- `package.json` - Updated `cf-build` and `cf-deploy` scripts to include the patch step

### The Polyfill
```js
if (typeof globalThis.FinalizationRegistry === "undefined") {
  globalThis.FinalizationRegistry = class FinalizationRegistry {
    constructor() {}
    register() {}
    unregister() {}
  };
}
```

This is safe because:
1. The `FinalizationRegistry` in undici is used for memory management (cleaning up abort listeners)
2. A no-op version won't cause functional issues - at worst it means slightly delayed GC of AbortControllers
3. In the serverless Workers environment, the entire worker is short-lived anyway

## Build/Deploy Commands
```bash
# Build (includes patch)
npm run cf-build

# Deploy (builds + patches + deploys)
npm run cf-deploy

# Or manually:
npx @opennextjs/cloudflare build --dangerouslyUseUnsupportedNextVersion
node scripts/patch-cf-handler.mjs
CLOUDFLARE_API_TOKEN=<token> npx wrangler deploy
```

## Verification
```
$ curl -s -o /dev/null -w "%{http_code}" \
    -X POST "https://answerpulse.answerpulse-cf.workers.dev/api/analyze" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com"}'
200
```

## Reusable for Other Projects
Any Next.js project using `@opennextjs/cloudflare` with dependencies that pull in `undici` (cheerio, various HTTP libraries) may encounter this issue. The `scripts/patch-cf-handler.mjs` script can be copied to any such project.

If additional missing globals are encountered, simply add them to the `POLYFILL_BANNER` in the patch script.
