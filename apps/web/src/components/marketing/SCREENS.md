# QuoteFlow screenshots for the website

The marketing pages show real screenshots of QuoteFlow in ServiceBook's device frames
(`apps/web/src/components/marketing/ScreenFrame.tsx`). Every file in `apps/web/public/screens/` is listed in
`apps/web/src/components/marketing/screens.ts`; keep the two in step. All eleven are real captures
of the seeded demo business; retake them all together whenever a page they show changes.

## How to capture them

- **Data:** a fresh demo (`pnpm seed` into an empty database), so the dates are relative to today.
  The demo page says "Screenshots from the demo business", so use the demo, not another account.
  Sign in as the demo owner (Tolu Adebayo of Lagoon Home Services, Lagos, in naira).
- **Order:** take the signed-in screens first. Opening a quote as the customer marks it as viewed,
  and accepting it changes the dashboard's figures; seed again before a second attempt.
- **Origin:** serve the app under the deployed origin (the README's example production URL,
  `https://quote-flow.vercel.app`) so share links don't read `localhost`. With Playwright, route
  every request for that origin to the dev server and rewrite the `Origin` header to the dev
  server's, which the API trusts.
- **Theme:** light (`localStorage.quoteflow_theme = 'light'`, `colorScheme: 'light'`). The frames
  stay light in dark mode too.
- **Browser:** locale `en-US`, time zone `Africa/Lagos` (the demo business's own).
- **Desktop ("browser"):** viewport **1440×900** CSS px at device scale **2**, then resized to
  **2160×1350** (Lanczos). Capture the viewport only, scrolled to the top. The frame adds its own
  window bar; don't include browser chrome.
- **Phone ("phone"):** viewport **390×844** CSS px at device scale **2** (`isMobile`, `hasTouch`)
  → a **780×1688** image. Capture the viewport only. The frame adds a status bar above it.
- **Before you capture:** wait for fonts and data (no skeletons), for the dashboard's numbers to
  finish counting up and for every entrance animation to end. No open menus, toasts, hover states
  or focus rings: blur the focused field and move the mouse away.
- **Format:** webp, quality 80 (PIL, `method=6`), keeping the exact file names. Desktop files come
  out at 65–85 KB, phone files at 35–50 KB. Nothing personal: the demo's customers are invented.

## The screenshots

| File                         | Frame                        | Route and state                                                                                                                                                                                                                                      | What is visible                                                                                                                                                 | Used on                                                        |
| ---------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `dashboard.webp`             | browser, address "dashboard" | `/dashboard`, with the chart switched to **Quoted** (the demo quotes more often than it is paid, so that series has more to show)                                                                                                                    | Greeting header, the joined key-figures strip, the 30-day "Value quoted" chart, the three banners and the "Money to collect" heading                            | Home (row "Know who still owes you"), Features (#dashboard)    |
| `quote-editor.webp`          | browser, "quotes"            | `/quotes/<id>/edit` for the newest **draft** (LHS-Q-0017, Chinedu Obi). Tap the "Deep cleaning" service chip, set its quantity to 3, choose a **Percent** discount of 5, don't save                                                                  | Customer card, three line items with quantities and prices, and the summary on the right with subtotal, discount, tax and total                                 | Features (#quotes)                                             |
| `quote-detail.webp`          | browser, "quotes"            | `/quotes/<id>` for Tunde Bakare's **viewed** quote (LHS-Q-0011)                                                                                                                                                                                      | Title with the Viewed badge, the ink total panel with its progress steps, the share panel ("Share on WhatsApp", copy link) and the top of the document          | Features (#sharing)                                            |
| `invoice-detail.webp`        | browser, "invoices"          | `/invoices/<id>` for Adaeze Okonkwo's **partially paid** invoice (LHS-INV-0007)                                                                                                                                                                      | Balance due on the ink panel with the paid progress bar, "Record payment", the share panel and the payments list with the deposit                               | Features (#invoices)                                           |
| `customer-detail.webp`       | browser, "customers"         | `/customers/<id>` for Kemi Adeyemi (Palm View Estates)                                                                                                                                                                                               | Name, the stat strip (quotes, accepted, invoices, overdue), the contact card, notes, and the quotes and invoices lists                                          | Features (#customers)                                          |
| `quote-mobile.webp`          | phone, ink bar               | The customer page `/quote/<token>` of Amaka Nwankwo's **sent** quote (LHS-Q-0015, the one the website's "Open a quote as the customer" opens), signed out, scrolled just enough (about 40 px) for the status badge to clear the Accept / Decline bar | The ink band, "Quote from Lagoon Home Services" with the quote number and contact buttons, the top of the quote, and the bar with the total, Decline and Accept | Home hero, Features (#customer-page), Demo page (step 3)       |
| `quote-accepted-mobile.webp` | phone, ink bar               | The same page right after tapping **Accept** and confirming, scrolled to the top                                                                                                                                                                     | "Quote accepted. Thank you!" under the business card                                                                                                            | Home (row "Your customer says yes"), Features (#customer-page) |
| `quote-share-mobile.webp`    | phone, ink bar               | `/quotes/<id>` for Amaka Nwankwo's **sent** quote (LHS-Q-0015, taken before it is opened as the customer), at the top. She has a phone number, so no "will open without a chat" note shows                                                           | The ink total panel, "Share on WhatsApp", the copy-link and preview buttons and the link                                                                        | Demo page (step 2)                                             |
| `quote-editor-mobile.webp`   | phone, ink bar               | `/quotes/<id>/edit` for the same draft and the same unsaved changes as `quote-editor.webp`, scrolled so item 2 sits under the ink top bar                                                                                                            | Items 2 and 3 with quantities, units and prices, and the floating bar with the total, "For Chinedu Obi · 3 items" and the save buttons                          | Demo page (step 1)                                             |
| `invoice-mobile.webp`        | phone, ink bar               | The customer page `/invoice/<token>` of Adaeze Okonkwo's **partially paid** invoice, signed out, at the top                                                                                                                                          | The ink band, "Invoice from Lagoon Home Services", the amount due, the "paid of total" progress and the top of the invoice                                      | Demo page (step 4)                                             |
| `dashboard-mobile.webp`      | phone, ink bar               | `/dashboard`, with the chart switched to **Quoted**, at the top                                                                                                                                                                                      | Ink top bar, greeting, "New quote", the stat strip, the top of the chart and the tab bar                                                                        | Solutions ("A day with QuoteFlow")                             |

The frame paints ink behind the notch (`ScreenFrame.tsx`), so every phone screen must start with
ink: the phone top bar in the app, and the band across the top of the customer pages, which is
ink because the demo business keeps the default brand colour.

## Checking them

Open `/`, `/features`, `/solutions` and `/demo` (every step of the tour) at 1440 and 390 wide, in
light and dark mode, and check that each screenshot is sharp, fills its frame with no
letterboxing, and matches its `alt` text in `screens.ts` (update the alt text if what's on screen
changed).
