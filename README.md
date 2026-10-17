# Squish Pop Studio 🎈

A responsive, colorful squishy storefront built as a **separate** website from Cloud Club. Six draft product listings (two units planned for each option), working browser shopping bag, search/filter, product details, mobile layouts and subtle animations. Product pictures were cropped from the owner's supplier screenshots. Replace with photos of received goods before opening.

## Store status

- **Storefront:** ready to preview (HTML/CSS/JS included).
- **Paid checkout:** coded through **Stripe Checkout**, but **NOT live** until the adult account owner provides a verified Stripe live account, shipping rate, and opens the store. Until then payment buttons remain disabled.
- **Sales counts:** retrieved from actual paid live-mode Stripe Checkout Sessions after keys are connected. Never fabricated. Initial counts are zero. For a large order history the currently capped pagination should be replaced with webhook-driven aggregates.
- **Reviews:** verified purchasers can submit them after a successful payment; submitted reviews remain pending moderation and do not appear publicly until manually approved in the Netlify Blobs `squish-pop-reviews` store under `published/`. No artificial reviews.
- **Stock:** simple paid-sales checks and per-order caps; the check is not atomic. Before heavy traffic or multiple simultaneous buyers, connect a transactional inventory database or a hosted commerce platform. Do not advertise real-time stock guarantees from this prototype.
- **Pictures/pricing:** the photographs are cropped supplier screenshots, and **all six prices are drafts**, based on your $7–$10 target. Confirm names, accuracy, actual condition, stock and price before launch.

## Costs

GitHub and Netlify have free tiers, subject to their plan limitations and usage. Stripe Standard typically has no monthly platform fee for payment processing, but **card-processing fees are charged for every successful sale**. Wix was not used for this Netlify build. Do not subscribe to any paid plans without checking with the adult store owner.

## Deploy using GitHub and Netlify

1. Create a **new GitHub repository** named `squish-pop-studio` (separate from Cloud Club). Upload the full **unzipped contents** of this folder, keeping `public`, `netlify/functions`, `package.json`, and `netlify.toml` in the repository root. Do not upload `.env` or any payment keys.
2. In [Netlify](https://app.netlify.com), choose **Add new project → Import an existing project → GitHub**, select the new repository, and deploy. `netlify.toml` specifies publish directory `public` and Netlify Functions `netlify/functions`. Netlify will assign a free `*.netlify.app` domain.
3. Check the live URL: product cards should show all six options; adding/removing items should update the bag. Until activated, checkout appropriately says payment is not open.
4. Have the **parent/guardian**, as the legitimate business and payment account owner, create and fully verify a [Stripe account](https://dashboard.stripe.com/register). Use the Stripe dashboard's Shipping rates to create a **fixed shipping rate that covers real postage**. Make sure the country, shipping restrictions, tax handling, business details, returns/refunds, and toy safety compliance are correct. Do not sell products without verifying safety documentation appropriate to their intended age/category, and check recalled products.
5. In the Netlify project's **Project configuration → Environment variables**, add these as **site runtime environment variables**, NOT in GitHub/code. Parent should copy secrets privately from their Stripe dashboard; never paste them into this chat:

   - `STRIPE_SECRET_KEY` = Stripe **live** secret key (`sk_live_…`). Store as a secret, available to Netlify Functions.
   - `STRIPE_SHIPPING_RATE_ID` = Stripe live Shipping Rate identifier (`shr_…`).
   - `STORE_OPEN` = `true` **only after** the parent confirms all safety and fulfillment requirements and verifies the payments/shipping test.
   - `STRIPE_AUTOMATIC_TAX` = `true` **only** after enabling Stripe Tax on the merchant account and confirming tax requirements. Otherwise leave unset. Consult a qualified tax professional if unsure.

6. Trigger a fresh Netlify deploy after saving environment variables. Then have the parent perform a **small real payment test** and confirm Stripe reports `paid`, shipping and taxes are displayed correctly, the return page handles the completed session, the order is visible in the Stripe dashboard, and a refund can be issued. Never input card details into your own app—customers are redirected to the genuine `checkout.stripe.com` payment page.
7. Once launched, **fulfill orders from Stripe's payment-confirmed dashboard records**, not from a browser success message alone. Monitor actual remaining stock; this is a small first batch. Set `STORE_OPEN=false` to stop new checkouts if anything needs fixing.

This kit does **not** currently include automatic shipping labels, tax advice, card disputes, order-fulfillment automation, customer accounts, or a finished moderation dashboard. Those remain future store improvements and should not be claimed as ready.

## File guide

- `public/index.html` — homepage & catalog layout.
- `public/assets/styles.css` — styling, animations, responsive layout.
- `public/assets/app.js` — shopping bag, search, filtering and storefront interactions.
- `public/assets/*.webp` — product preview images from owner's screenshots.
- `netlify/functions/checkout.mjs` — server-side validated Stripe Checkout session creation; blocks checkout until verified launch configuration.
- `netlify/functions/order.mjs` — Stripe payment confirmation on success return.
- `netlify/functions/stats.mjs` — counts completed **live** payments and published reviews.
- `netlify/functions/review.mjs` — authenticated purchaser submission to review moderation queue.
- `netlify/functions/store-status.mjs` — public launch status (never reveals secrets).

## Local checks

Requires Node.js 20 or newer.

```bash
npm install
npm run check
```

For a local static preview: `cd public && python3 -m http.server 8000`, then open `http://localhost:8000`. Checkout functions only run after a Netlify deployment or through `netlify dev` with appropriate environment variables. Alternatively open `Squish_Pop_Studio_Preview.html` directly; it is an offline preview and will **never** accept payment by itself.
