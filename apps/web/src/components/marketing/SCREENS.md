# QuoteFlow screenshots for the website

The website shows real screenshots of QuoteFlow in Signal's device frames
(`apps/web/src/components/marketing/ScreenFrame.tsx`): a paper browser window with a mono address
bar, and a navy phone that draws its own status bar above the screen. Every file in
`apps/web/public/screens/` is listed in `apps/web/src/components/marketing/screens.ts`; keep the two
in step.

- **Phones get phones.** Each desktop screen has a phone partner (`mobile` in `screens.ts`), which
  the frame shows in its place below `sm`: a 1440-wide capture squeezed to a phone is unreadable.
- **Dark mode gets dark screens.** The owner's screens are captured in both themes (`<name>.webp`
  and `<name>-dark.webp`) and the frame picks the one for the website's theme. The customer's
  pages (`quote-mobile`, `quote-accepted-mobile`, `invoice-mobile`) are always light, like the
  pages themselves, so they have no dark version.

All 23 files (13 screens, 10 of them in both themes) were taken in Signal on 11 October 2026, from
one fresh demo in the afternoon (so the dashboards say "Good afternoon"). Retake them all together,
with the same file names, whenever a page they show changes.

## How to capture them

- **Data:** a fresh demo (`pnpm seed` into an empty database), so the dates are relative to today.
  The demo page says "Screenshots from the demo business", so use the demo, not another account.
  Sign in as the demo owner (Tolu Adebayo of Lagoon Home Services, Lagos, in naira, brand colour
  lagoon teal).
- **Don't use the demo buttons:** with `DEMO_LOGIN_ENABLED`, "Explore the demo" and "Open a quote as
  the customer" (`POST /api/auth/demo` and `/api/auth/demo/quote`) rebuild a seeded demo, because
  the seed backdates it and it looks more than a day old: every id and the owner's password change.
  Find the documents yourself (the app's lists, or the API).
- **Order:** take the signed-in screens first, in both themes. Opening a quote as the customer
  marks it as viewed, and accepting it changes the dashboard's figures; seed again before a second
  attempt.
- **Origin:** serve the app under the deployed origin (the README's example production URL,
  `https://quote-flow.vercel.app`) so share links don't read `localhost`. With Playwright, route
  every request for that origin to the dev server and rewrite the `Origin` header to the dev
  server's, which the API trusts. Vite's HMR socket can't follow, so route WebSockets to a stub
  (`context.routeWebSocket`) to keep the console clean.
- **Theme:** each owner's screen twice: light (`localStorage.quoteflow_theme = 'light'`,
  `colorScheme: 'light'`), then dark (`'dark'`, saved as `<name>-dark.webp`). The customer's pages
  only in light. A screen with no dark capture keeps a light browser frame (`scheme-light`) in dark
  mode; the phone is navy in both.
- **Browser:** locale `en-US`, time zone `Africa/Lagos` (the demo business's own).
- **Desktop ("browser"):** viewport **1440×900** CSS px at device scale **2**, then resized to
  **2160×1350** (Lanczos). Capture the viewport only, scrolled to the top unless the table says
  otherwise. The top bar is sticky, so the hazard tape and the top bar are always in the picture.
  The frame adds its own window bar; don't include browser chrome.
- **Phone ("phone"):** viewport **390×844** CSS px at device scale **2** (`isMobile`, `hasTouch`)
  → a **780×1688** image. Capture the viewport only. The frame adds a navy status bar above it, so
  the screen may start with anything: the app's hazard tape, or the business's teal band on a
  customer page.
- **Before you capture:** wait for fonts and data (no skeletons), for the dashboard's numbers to
  finish counting up and for every entrance animation to end: the tape measures pulled out, the
  stamps landed, and the hazard tape standing still (it scrolls while anything loads). No open
  menus, toasts, hover states or focus rings: blur the focused field and move the mouse away.
  Scroll back to the top just before a top-of-page capture: focus handling can leave a page a few
  pixels down.
- **Format:** webp, quality 80 (PIL, `method=6`), keeping the exact file names. Desktop files come
  out at 75–135 KB, phone files at 45–85 KB (Signal's hazard tape, rulers and dashed rules cost
  more than flat colour). Nothing personal: the demo's customers are invented.

## The screenshots

| File                          | Frame                        | Themes      | Route and state                                                                                                                                                                                                                                                         | What is visible                                                                                                                                                                                                        | Used on                                                                               |
| ----------------------------- | ---------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `dashboard.webp`              | browser, address "dashboard" | light, dark | `/dashboard` as it opens                                                                                                                                                                                                                                                | The top bar with its counts ("Quotes", a red "Invoices" overdue count), the greeting, the perforated key-figures strip, the payments chart, "Needs attention" and the top of "Money to collect"                        | Home (row "Know who still owes you"), Features (#dashboard), from `sm`                |
| `quote-editor.webp`           | browser, "quotes"            | light, dark | `/quotes/<id>/edit` for the newest **draft** (LHS-Q-0017, Chinedu Obi). Tap the "Deep cleaning" service, set its quantity to 3, choose a **Percent** discount of 5, don't save. Scroll so the Items card sits 16 px under the top bar                                   | Three line items with quantities, units and prices, the services to add from, and the summary ticket with the customer, subtotal, discount, tax and total                                                              | Features (#quotes), from `sm`                                                         |
| `quote-detail.webp`           | browser, "quotes"            | light, dark | `/quotes/<id>` for Tunde Bakare's **viewed** quote (LHS-Q-0011)                                                                                                                                                                                                         | The title with its Viewed tag, the total stub with the tape-measure progress, the share panel ("Share on WhatsApp", copy link) and the top of the quote ticket                                                         | Features (#sharing), from `sm`                                                        |
| `invoice-detail.webp`         | browser, "invoices"          | light, dark | `/invoices/<id>` for Adaeze Okonkwo's **partially paid** invoice (LHS-INV-0007)                                                                                                                                                                                         | The balance-due stub, the "Collected" tape measure, "Record payment", the share panel and the payments list with the deposit                                                                                           | Features (#invoices), from `sm`                                                       |
| `customer-detail.webp`        | browser, "customers"         | light, dark | `/customers/<id>` for Kemi Adeyemi (Palm View Estates)                                                                                                                                                                                                                  | Her name, the key figures (quotes, accepted, invoices, overdue), contact details, the top of her notes, and her quotes and invoices                                                                                    | Features (#customers), from `sm`                                                      |
| `dashboard-mobile.webp`       | phone                        | light, dark | `/dashboard` as it opens, at the top                                                                                                                                                                                                                                    | The app bar, the greeting, the key-figures ticket, "Needs attention" and the bottom tab bar with the orange New key                                                                                                    | Solutions ("A day with QuoteFlow"); phones: Home and Features in place of `dashboard` |
| `quote-editor-mobile.webp`    | phone                        | light, dark | `/quotes/<id>/edit` for the same draft and the same unsaved changes as `quote-editor.webp`, at the top                                                                                                                                                                  | The app bar, "Edit LHS-Q-0017", the customer picked (Chinedu Obi), the first item and the floating bar with the total, "For Chinedu Obi · 3 items" and the save buttons                                                | Demo page (step 1); phones: Features in place of `quote-editor`                       |
| `quote-share-mobile.webp`     | phone                        | light, dark | `/quotes/<id>` for Amaka Nwankwo's **sent** LHS-Q-0015 (the quote below), taken before it is opened as the customer, scrolled just enough (about 40 px) for the link to clear the tab bar. Its customer has a phone number, so no "will open without a chat" note shows | The title with its Sent tag, the total stub, the tape-measure progress, "Share on WhatsApp", the copy-link and preview buttons, the link and the tab bar                                                               | Demo page (step 2); phones: Features in place of `quote-detail`                       |
| `invoice-detail-mobile.webp`  | phone                        | light, dark | `/invoices/<id>` for the same invoice as `invoice-detail.webp`, at the top                                                                                                                                                                                              | The title with its Part paid tag, "Record payment", the balance-due stub, the collected tape measure and the top of the share panel                                                                                    | Phones: Features in place of `invoice-detail`                                         |
| `customer-detail-mobile.webp` | phone                        | light, dark | `/customers/<id>` for Kemi Adeyemi, at the top                                                                                                                                                                                                                          | Her name, New quote, Edit and Archive, the key figures and the top of her contact card                                                                                                                                 | Phones: Features in place of `customer-detail`                                        |
| `quote-mobile.webp`           | phone                        | light       | The customer page `/quote/<token>` of the quote the website's "Open a quote as the customer" opens: the newest sent or viewed quote, Amaka Nwankwo's **sent** LHS-Q-0015 in a fresh demo. Signed out, at the top                                                        | The business's teal band with its contact buttons, the quote ticket's stub (number, "Waiting for you" tag, dates), who it is prepared for, the first item, and the answer bar with the total, Decline and Accept quote | Features (#customer-page), Demo page (step 3)                                         |
| `quote-accepted-mobile.webp`  | phone                        | light       | The same page right after tapping **Accept quote** and confirming in the dialog, scrolled to the top                                                                                                                                                                    | The teal band, "Quote accepted. Thank you!" and the quote ticket stamped Accepted with the day and time                                                                                                                | Home (row "A clean quote they can answer"), Features (#customer-page)                 |
| `invoice-mobile.webp`         | phone                        | light       | The customer page `/invoice/<token>` of Adaeze Okonkwo's **partially paid** invoice, signed out, at the top                                                                                                                                                             | The teal band, the amount due, the paid-of-total tape measure and the top of the invoice ticket                                                                                                                        | Demo page (step 4)                                                                    |

## Checking them

Open `/`, `/features`, `/solutions` and `/demo` (every step of the tour) at 1440 and 390 wide, in
light and dark mode, and check that each screenshot is sharp, fills its frame with no
letterboxing, and matches its `alt` text in `screens.ts` (update the alt text if what's on screen
changed).
