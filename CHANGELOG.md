# Changelog

Every release of QuoteFlow is a git tag `vMAJOR.MINOR.PATCH` on `master`. Each entry has an
**Upgrading** section that says what an existing deployment needs: environment variable changes,
data migrations, manual steps, and whether to take a backup first. Read it before deploying a
release to a client. How releases are cut and rolled out: [docs/RELEASING.md](docs/RELEASING.md).

## Unreleased

QuoteFlow becomes a product sold to one business at a time, with a separate copy for each client.
This work is in progress and not ready for clients yet.

### Changes

- The multi-business SaaS version is frozen as the tag `saas-final` and the branch `saas-legacy`,
  both at commit `e263b97`. The live SaaS site is to deploy only from `saas-legacy` (see the manual
  steps below) until it becomes the sales demo. No code changes.
- The build checks the environment first (`pnpm env:check`, the first step of the Vercel build
  command). A missing or invalid variable fails the build, the build log names it, and the current
  deployment keeps serving instead of a new one that answers every request with an error. A
  production deployment gets the production rules even when `NODE_ENV` is missing. Vercel preview
  and development builds skip the check.
- The API warns at start-up when the production `APP_URL` is still a host's default address
  (`*.vercel.app`, `*.onrender.com`), because customer links would show the host's name.
- Every page is sent with security headers: a strict Content-Security-Policy (no inline or
  evaluated script, no framing), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` and
  `Permissions-Policy`. The admin, the customer quote and invoice links and the API (including
  the customer PDF links) also tell search engines not to index them. The script that applies dark mode before the page appears is now a
  file, `/theme-init.js`, and form validation no longer uses `eval`.

### Upgrading

- **Environment:** No new variables. A deployment whose environment fails the check now fails its
  build, where before it deployed and answered 503: fix the variables the build log names, then
  redeploy. On Vercel, the Production environment must set `NODE_ENV=production` (the README has
  always asked for it).
- **Migrations:** None.
- **Manual steps:** The owner finishes the checklist in
  [docs/RELEASING.md](docs/RELEASING.md#owner-checklist) (push the tag and branch, pin the live site
  to `saas-legacy`, confirm a push to `master` doesn't redeploy it, tell real users and offer an
  export) before any later change merges into `master`. A deployment that serves the web app with
  the API on another origin (`VITE_API_URL` set) must allow that origin in its own
  Content-Security-Policy; the policy in `vercel.json` allows the same origin only.
- **Backup required:** No (the checklist takes a backup of the live SaaS database anyway).

## saas-final (2026-10-11)

The last version of QuoteFlow as a multi-business SaaS, with open sign-up, the marketing site and
the one-click demo login. It is a baseline marker, not a client release: the live SaaS site keeps
running it from the `saas-legacy` branch.
