# MBA – Small Savings, Big Goals (web app, mobile-first)

Built as a mobile-first web app (Flutter/Android is not supported here). Payments are simulated; real UPI provider plugs in later.

## Screens
1. **Splash** (~3s): light blue/white, MBA logo fades in, rupee coins flow, growth arrow rises, skip button. Works offline (pure CSS/SVG).
2. **Welcome**: English / हिंदी toggle, "Welcome to MBA", tagline, GET STARTED / शुरू करें. Language saved and changeable in Settings.
3. **Login / Sign up**: email + password, profile with full name and mobile number.
4. **Home dashboard**: Hello, user · Total Saving · Day Streak · Active Goals · Rewards; six boxes in fixed order: Mobile Recharge, Mobile, Laptop, Bike, College Saving, Custom Saving.
5. **Mobile Recharge**: 28/56/84 days × 1.5GB/2GB, mobile number, daily saving (56d ₹10.80/₹11.80, 84d ₹11.20/₹12.00, 28d ₹13.50/₹13.47 marked "pending confirmation"), plus the first-1,000-downloads offer terms (shown as proposed, not guaranteed).
6. **Mobile Saving**: Android (Samsung first, Pixel, OnePlus, Vivo, Oppo; ₹1,00,000 / 365 → ₹280 display) and iPhone 16–18 models with storage variant; daily = price ÷ 365 + ₹1.
7. **Laptop**: MacBook, HP, ASUS VivoBook (₹55k–₹70k), brand filter; price ÷ 365 + ₹1.
8. **Bike**: Royal Enfield, Hero Splendor, Bajaj, TVS Apache, Pulsar (₹75k–₹3L); price ÷ 365 (+ configurable extra).
9. **College**: ₹49+₹1, ₹100+₹1, ₹199+₹1.
10. **Custom Saving**: preset/custom amount with min/max validation, generate UPI QR (demo), download/share QR, change amount, payment status.
11. **Goal detail**: saved, remaining, daily amount, progress %, dates, status, pause; "Pay today" opens demo QR → "Simulate payment confirmed".
12. **My Goals & History**: active/completed goals, transaction list (ID, amount, method, date, status).
13. **Rewards**: streak, rewards list, offer terms.
14. **Settings**: language, profile, sign out.
15. **Admin panel** (admin role only): edit products (add, price, image, enable/disable), daily saving rules and recharge prices, offer text, view users and transactions.

## Rules
- All daily-saving math and payment confirmation run on the server, not the browser.
- A demo payment credits a goal exactly once (idempotent by order ID); amounts checked against the order.
- Streak +1 once per day on the first confirmed payment (IST); missing a day resets it.
- Rounding: 2 decimals, configurable display override (e.g. ₹280).

## Design
Light Blue primary, White secondary, Dark Blue accent, Light Grey support; Hindi-capable font (Noto Sans Devanagari + a clean display font). Generated MBA logo (rupee coin + upward arrow).

## Technical details
- Lovable Cloud: profiles, user_roles (admin), modules, products, app_config, saving_goals, transactions (unique order id), saving_ledger (insert-only), streaks, rewards. RLS: users see only their own rows; admins manage catalog/config.
- Server functions for create goal, create demo order, confirm demo order (validates owner/amount/not-already-paid, updates ledger, goal, streak).
- Seed products and config in migration.
- QR via `qrcode` package encoding a demo UPI link.
- Unit tests for calculation rules (₹55,000 → ₹151.68, recharge prices, college totals).
