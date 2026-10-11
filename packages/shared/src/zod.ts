import { z } from 'zod';

// The web app's Content-Security-Policy has no 'unsafe-eval' (apps/web/vercel.json). Without this,
// zod compiles object validators with `new Function`, and even its check for whether it may do so
// reports a CSP violation. Every schema here is built from this `z`, so the setting always comes
// first, whatever order a bundler puts the modules in. package.json lists this file under
// `sideEffects`: `z` is only re-exported here, so a bundler would otherwise skip the file.
z.config({ jitless: true });

export { z };
