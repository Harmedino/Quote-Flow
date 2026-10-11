# Releasing

How QuoteFlow versions are frozen, released and rolled out. Section 1 is a one-off job for the
owner that must be finished before anything else merges. Sections 2 and 3 apply to every release.

- [1. Freeze the SaaS version](#1-freeze-the-saas-version)
- [2. Release notes](#2-release-notes)
- [3. How releases work](#3-how-releases-work)

## 1. Freeze the SaaS version

The live SaaS site is one Vercel project that serves the web app and the API together, and it
deploys automatically from a branch. The work that turns QuoteFlow into a product sold to one
business at a time closes sign-up, removes the marketing site and changes the environment the API
expects. If that work merged into the branch the live site deploys from, the live site would change
or break for the people using it. So the SaaS version is frozen first, and the live site is pinned
to it.

### What is frozen

| Name          | Kind   | Points at                                  | Rule                                                                      |
| ------------- | ------ | ------------------------------------------ | ------------------------------------------------------------------------- |
| `saas-final`  | tag    | `e263b97fb474922526fc429c0a94cbe74dbad100` | Never moves and is never deleted.                                         |
| `saas-legacy` | branch | `e263b97fb474922526fc429c0a94cbe74dbad100` | The branch the live site deploys. Takes only an urgent fix for that site. |

Commit `e263b97` ("Merge pull request #7") is the multi-business SaaS: open sign-up, the marketing
site and the one-click demo login. It is the tip of `master` on GitHub today, and it stays in the
history of `master` whatever happens to the tag and the branch: they only give the commit names that
don't move, and give Vercel a branch that new work never reaches. Two names are used because a tag
and a branch with the same name make git refs ambiguous, and hosts deploy branches, not tags.
Nothing on `saas-legacy` is ever merged back into `master`.

### Record

Checked from the repository on 2026-10-11:

- `origin/master` and `origin/claude/quoteflow-saas-build-mjes4l` both point at `e263b97`.
- `saas-final` and `saas-legacy` were created at `e263b97` in the build environment. That
  environment can't push to GitHub (the push was refused with HTTP 403), so pushing them is step 2
  of the checklist below.
- The repository can't show which branch the live Vercel project deploys. The owner reads it in the
  Vercel dashboard (step 1) and fills in the last column.

| Item                                               | Expected                                       | Confirmed by the owner |
| -------------------------------------------------- | ---------------------------------------------- | ---------------------- |
| Vercel project that serves the live SaaS site      | one project (web app and API)                  |                        |
| Production domain                                  | `quote-flow.vercel.app`                        |                        |
| Production branch before the freeze                | `master` (or the working branch)               |                        |
| Commit of the current production deployment        | `e263b97`                                      |                        |
| Deployment to roll back to if something goes wrong | the current production deployment (its URL)    |                        |
| `saas-final` and `saas-legacy` on GitHub           | both at `e263b97`                              |                        |
| Production branch after the freeze                 | `saas-legacy` (or automatic deploys off)       |                        |
| Preview deployments                                | off, or using a separate database              |                        |
| Test push to `master` reached production           | no                                             |                        |
| Real users found, told, exports sent               | a count and dates, never names or emails       |                        |
| Checklist finished (date, who)                     | before the first single-business change merges |                        |

### Owner checklist

Do these in order. Until step 3 is done, push nothing to this repository except the tag and the
branch in step 2: the live project may deploy from `master` or from
`claude/quoteflow-saas-build-mjes4l`, and Vercel builds a preview of every other push. Until step 6
is done, merge no single-business change into `master`. Vercel moves its menus from time to time; if
a setting isn't where this says, search the Vercel documentation for the setting's name.

1. **Look up what the live site deploys.** In Vercel, open the project that serves the live SaaS
   site.
   - Note its production branch: the **Production Branch** setting (under _Settings → Git_, or
     _Settings → Environments → Production_ on newer dashboards).
   - In _Deployments_, open the current production deployment and note its branch, its commit
     (expected `e263b97`) and its URL. This is the deployment to roll back to.
   - Check that no other Vercel project deploys from this repository: the Vercel project list, and
     the _Deployments_ list on the GitHub repository page, which names every Vercel environment.
   - Fill in the first rows of the table above.

2. **Push the tag and the branch.** From a clone that has them
   (`git rev-parse saas-final saas-legacy` prints `e263b97fb474922526fc429c0a94cbe74dbad100` twice):

   ```bash
   git push origin saas-final
   git push origin saas-legacy
   ```

   From any other clone, create them at the exact commit first, then push as above:

   ```bash
   git fetch origin
   git tag saas-final e263b97fb474922526fc429c0a94cbe74dbad100
   git branch saas-legacy e263b97fb474922526fc429c0a94cbe74dbad100
   ```

   Check that both arrived: `git ls-remote origin refs/tags/saas-final refs/heads/saas-legacy` lists
   both at `e263b97fb474922526fc429c0a94cbe74dbad100`. Vercel may build a preview of `saas-legacy`
   when it arrives; that is expected, because it is the live code.

3. **Pin the live site** in the same Vercel project. Choose one:
   - **Recommended:** set **Production Branch** to `saas-legacy`. Changing it doesn't redeploy: the
     current production deployment, built from `e263b97`, keeps serving, and it is the same code.
   - **Or** turn automatic deploys off: set **Ignored Build Step** (_Settings → Git_) to "Don't
     build anything", or to the custom command `exit 0`. The current production deployment keeps
     serving, and nothing deploys until you change the setting back.

   With the production branch option, also deal with previews. Vercel builds a preview of every
   push to any other branch, and the README's setup gives the Preview environment the same
   `MONGODB_URI` as production, so previews of the new code would run against the live SaaS
   database. Either set **Ignored Build Step** to build production only (the "Only build
   production" option, or this custom command), or give the Preview environment its own
   `MONGODB_URI` pointing at a scratch database:

   ```bash
   if [ "$VERCEL_ENV" = "production" ]; then exit 1; else exit 0; fi
   ```

   (The Ignored Build Step skips the build when the command exits 0 and builds when it exits 1.)

4. **Confirm a push to `master` doesn't redeploy the live site.** Push an empty commit to `master`.
   It changes no files, so even if it did deploy, the live site would run the same code:

   ```bash
   git fetch origin
   git worktree add --detach ../quoteflow-noop origin/master
   git -C ../quoteflow-noop commit --allow-empty -m "chore: check that master no longer deploys the live site"
   git -C ../quoteflow-noop push origin HEAD:master
   git worktree remove ../quoteflow-noop
   ```

   If `master` only accepts pull requests, push the empty commit to a new branch instead
   (`git -C ../quoteflow-noop push origin HEAD:refs/heads/check-live-site`) and merge it through a
   pull request.

   In _Deployments_, the push must show as a preview, or as cancelled by the Ignored Build Step,
   never as production, and the current production deployment must still be the one from step 1.
   Open the production domain: the marketing site and sign-up are still there, and `/api/health`
   returns `{"data":{"status":"ok",…}}`. If the push did reach production, use _Instant Rollback_
   on the deployment from step 1, then repeat step 3.

5. **Tell any real users what happens next and offer an export.** The backup and the exports below
   hold people's personal data. Make them in a private folder outside any git repository, never
   commit or share them, and send each export only to the person it belongs to.
   - **Find them.** Connect to the live database (Atlas Data Explorer, MongoDB Compass or `mongosh`)
     and list the accounts that aren't demo accounts. Demo accounts use the reserved
     `quoteflow.test` email domain; every other account was made through sign-up on the live site,
     including your own test accounts. `businessId` is the business each person belongs to.

     ```js
     db.users.find(
       { email: { $not: /@quoteflow\.test$/ } },
       { name: 1, email: 1, role: 1, businessId: 1, createdAt: 1, lastLoginAt: 1 },
     );
     ```

   - **Back up the live database** before anything else changes, with the
     [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/) (or take an Atlas
     snapshot on a cluster that has backups). `read -rs URI` asks for the live `MONGODB_URI`
     without showing it or saving it in your shell history:

     ```bash
     read -rs URI
     mongodump --uri "$URI" --out saas-backup-<date>
     ```

   - **Tell each real user** what happens next. The site stays as it is, with no new features,
     until a date you choose; on that date it becomes a sales demo with a new database, and their
     account stops working there. They can ask for an export before then. A message to adapt:

     > Thank you for using <service name>. The hosted service stays as it is until <date>, with no
     > new features. On <date> it closes, and your account and data will no longer be available
     > there. If you would like a copy of your customers, services, quotes and invoices, reply
     > before <date> and we will send you an export. Until then you can also download any quote or
     > invoice as a PDF from the app.

   - **Export a business on request.** Replace `<businessId>` with the person's `businessId`, and
     paste the live `MONGODB_URI` when `read` asks for it. Invoices include their recorded
     payments; people are exported without their password hashes.

     ```bash
     read -rs URI
     mongoexport --uri "$URI" --collection businesses --query '{"_id":{"$oid":"<businessId>"}}' --jsonArray --out business.json
     mongoexport --uri "$URI" --collection users --query '{"businessId":{"$oid":"<businessId>"}}' --fields name,email,role,createdAt --jsonArray --out users.json
     mongoexport --uri "$URI" --collection customers --query '{"businessId":{"$oid":"<businessId>"}}' --jsonArray --out customers.json
     mongoexport --uri "$URI" --collection services --query '{"businessId":{"$oid":"<businessId>"}}' --jsonArray --out services.json
     mongoexport --uri "$URI" --collection quotes --query '{"businessId":{"$oid":"<businessId>"}}' --jsonArray --out quotes.json
     mongoexport --uri "$URI" --collection invoices --query '{"businessId":{"$oid":"<businessId>"}}' --jsonArray --out invoices.json
     ```

6. **Sign off.** Fill in the remaining rows of the table above, the last one with the date and your
   name. For real users, write how many there were and when they were told, never their names or
   email addresses: this file is committed to the repository. Commit only this file
   (`git add docs/RELEASING.md`). Only then may single-business changes merge into `master`.

## 2. Release notes

Every release has an entry in [`CHANGELOG.md`](../CHANGELOG.md), and every entry has an
**Upgrading** section, so whoever deploys it to a client knows what that deployment needs. Changes
that aren't released yet collect under `## Unreleased` in the same shape. When a release is cut,
that heading becomes the version and date, and a new empty `## Unreleased` goes above it.

```markdown
## vX.Y.Z (YYYY-MM-DD)

One or two sentences on what the release does.

### Changes

- What changed, in words a client would understand.

### Upgrading

- **Environment:** new, renamed or removed variables, each with its default, or "No changes".
- **Migrations:** scripts to run, in order, dry run first, or "None".
- **Manual steps:** anything done by hand in the host or the app, or "None".
- **Backup required:** yes or no (yes whenever a release changes stored data).
```

## 3. How releases work

These rules apply from the first client release on. The client guide in the README will give every
host setting step by step.

- **Versions.** Each release is a tag `vMAJOR.MINOR.PATCH` on `master`, cut when the seller decides
  a set of changes is ready for clients.
- **Upgrades stay safe.** A new environment variable always has a safe default, so a deployment that
  doesn't set it keeps working. A renamed or removed variable logs a warning for one release before
  it goes. The build checks the environment, so a bad one fails the build and the previous
  deployment keeps serving. Data migrations are scripts with a dry run, run by hand.
- **Demo first.** The sales demo deploys from `master`, so every change runs there before any client
  gets it.
- **Client deployments** build only a `release` branch. Previews are off, and secrets live in the
  Production environment only. Each client has their own database, keys and accounts; no key works
  for another client.
- **Rolling out** (the seller triggers each client's deploy): read the release's **Upgrading**
  section, back up each client's database, move `release` to the new tag, then deploy each client
  and run any migrations it lists, dry run first.
- **The live SaaS site becomes the sales demo** when the sales-demo mode is released: repoint the
  live project from `saas-legacy` to `master`, set `SALES_DEMO=true`, point `MONGODB_URI` at a
  **new** database, and redeploy. Keep the old database read-only until every real user is handled,
  then delete it, the backup and any exports once you no longer need them. People can still sign up
  on the frozen site until the switch, so look for new real users again (step 5 of the checklist)
  just before it.
