// Validates the API's environment before a deploy (`pnpm env:check`). Runs first in the Vercel
// build command, so an invalid environment fails the build. Reads real environment variables
// only, never `.env`, like the production commands.
import { checkEnv } from '../src/config/env-check';

process.exitCode = checkEnv(process.env, {
  info: (line) => process.stdout.write(`${line}\n`),
  error: (line) => process.stderr.write(`${line}\n`),
});
