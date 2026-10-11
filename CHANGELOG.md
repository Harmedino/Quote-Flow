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

### Upgrading

- **Environment:** No changes.
- **Migrations:** None.
- **Manual steps:** The owner finishes the checklist in
  [docs/RELEASING.md](docs/RELEASING.md#owner-checklist) (push the tag and branch, pin the live site
  to `saas-legacy`, confirm a push to `master` doesn't redeploy it, tell real users and offer an
  export) before any later change merges into `master`.
- **Backup required:** No (the checklist takes a backup of the live SaaS database anyway).

## saas-final (2026-10-11)

The last version of QuoteFlow as a multi-business SaaS, with open sign-up, the marketing site and
the one-click demo login. It is a baseline marker, not a client release: the live SaaS site keeps
running it from the `saas-legacy` branch.
