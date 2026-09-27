# STORE — clothing storefront with a fitting room

A Next.js 16 rebuild of the [Aniq UI e-commerce clothes template](https://ecommerce-clothes-1.aniq-ui.com/en):
same layout, copy (English + Arabic), colours, fonts, imagery and animations, with a working
**"Try it on"** fitting room.

> The design, copy and photography belong to the Aniq UI template. Use them only under your
> template licence. The images are **not committed**: `npm install` downloads them into
> `public/assets/` (git-ignored). Keep this repository private if you commit anything from
> the template.

## Features

**Fitting room**
- Tap the **hanger** on any product card or product page to put the piece on. There is one piece per
  layer (headwear, top, outerwear, bottom, footwear); tapping again takes it off.
- **Model / Your photo**: try pieces on the demo mannequin, or upload a full-body photo. The photo is
  shown whole (not cropped) and stays in the browser.
- **Automatic fit**: pose detection ([MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker),
  running in the browser) finds the shoulders, hips, ankles, feet and head. Each garment is then sized
  and placed on them, scaled to the person's shoulder width and following a tilted pose. If no person is
  found, garments use standard proportions and the panel says so.
- **Full view**: a large editor where you tap a piece to drag it, resize it, reset the fit, change or
  remove the photo, and **Save image** (PNG of exactly what's on screen).
- **Exact look (automatic)**: with the store's `GEMINI_API_KEY` set in `.env.local`, every outfit is
  rendered photorealistically about a second after the last piece is added, by Google's Gemini image
  model (`gemini-3.1-flash-image`, falling back to `gemini-2.5-flash-image`). This works on the mannequin
  or the customer's photo. The instant preview stays visible meanwhile. The prompt requires each garment
  to match its product photo exactly (colour, fabric, prints, logos, buttons, pockets, length); on a
  customer photo it keeps their face, body, pose and background. **Preview / Exact look** switches views
  and **Redraw** asks for a new render.
- **Cost control**: mannequin looks are cached in memory and in `.cache/looks/` (shared by all visitors),
  so each outfit is paid for once. Each visitor is limited to `TRYON_RENDERS_PER_WINDOW` (default 20)
  fresh renders per 10 minutes on the store key. Check Google's current image pricing for your costs.
- Without a store key, shoppers can still press **Add your API key** and use their own Google AI key,
  as in the original demo.

**Store**
- **Home:** hero, service strip, "Three quiet obsessions", editorial split, categories, new drops,
  offer banner, best sellers, "Shop the Collection" slider, "A Closer Look" scroll spotlight,
  reviews and closing banner.
- **Header:** mega menus, EN/AR switcher (full RTL), light/dark theme, search (<kbd>Ctrl/⌘ K</kbd>),
  account menu and bag dropdown.
- **Shop:** promo carousel, category/price/highlight filters, search, five sort orders, pagination.
- **Product page:** image magnifier, colours, sizes (out-of-stock sizes disabled), quantity,
  Buy Now / Add to Cart, share links, Description/Reviews tabs, related products.
- **Other pages:** categories, cart (promo code `WELCOME10`), checkout (card numbers are Luhn-checked;
  demo card `4242 4242 4242 4242`), wishlist, account, order tracking, about, contact, FAQ.

**Animations**
- **On load and scroll:** hero zoom and parallax; sections fade and slide in as they enter the view.
- **Home showpieces:** the "Three quiet obsessions" panels expand on hover; the collection slider
  auto-advances; the spotlight is pinned while two columns swap pieces in opposite directions.
- **Product cards:** heart fill, hanger fade-in, orange corner that grows behind the cart button.
- **Navigation and panels:** mega-menu open/close, spring-animated panels and dialogs, button ripples.
- Everything respects `prefers-reduced-motion`.

## Getting started

```bash
npm install          # also copies the pose-detection runtime and downloads the storefront images
npm run dev          # http://localhost:3000 → /en
```

```bash
npm run build && npm start
npm run lint
npm run typecheck
```

## Layout

```
src/app/[lang]/            pages (home, shop, products/[slug], categories, cart, checkout, account, …)
src/app/api/fitting-room/  "Draw the look" → Gemini image model
src/components/home/       home page sections
src/components/fitting/    fitting room: trigger, panel, mannequin canvas, API-key dialog
src/components/layout/     header, mega menu, bag, search, footer
src/data/catalog.json      35 products, 7 categories, home-section picks (EN/AR)
src/lib/                   catalog helpers, i18n dictionaries, persisted stores
scripts/fetch-assets.mjs   image downloader (manifest in scripts/assets-manifest.json)
```
