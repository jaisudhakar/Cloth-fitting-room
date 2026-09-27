# Vestra — clothing store with a virtual fitting room

A Next.js storefront modelled on the [Aniq UI e-commerce clothes template](https://ecommerce-clothes-1.aniq-ui.com/en),
built around a **“Try this on”** virtual fitting room.

## Features

**Virtual fitting room** (`/[lang]/fitting-room`)
- **Try this on** from any product card or product page opens the fitting room with that piece on.
- **Who's trying on:** four built-in models, an uploaded full-body photo, a photo from the camera (with a 3-second timer), or a **live mirror** that tracks you through the webcam.
- **Automatic fit:** in-browser pose detection ([MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)) finds shoulders, hips and ankles, then scales, rotates and places each garment on the body. If no body is found, garments drop into a default position to adjust by hand.
- **Layering:** one garment per slot (top, bottom, dress, outerwear). A dress replaces separates, and vice versa.
- **Adjust:** drag a garment on the model, or use the size / length / rotate / opacity sliders. Arrow keys nudge the selected garment and Delete removes it.
- **Size-aware preview:** height, weight and fit preference give a recommended size. Choosing a smaller or larger size visibly narrows or widens the garment and flags it as tight or loose.
- **Hold to compare** before/after, **save photo** (PNG), and **add the whole look to the bag**.
- **Optional photoreal AI try-on** via the FASHN API (set `FASHN_API_KEY`). The key stays on the server (`/api/try-on`).
- Photos are processed on-device. Nothing is uploaded unless you use AI try-on.

**Store**
- Home: hero, categories, new arrivals, best sellers, promo banner, newsletter.
- Shop with filters (category, gender, size, colour, price, sale), sorting and search (also <kbd>Ctrl/⌘ K</kbd>).
- Product page: colour and size selection, size advisor and chart, on-model gallery, "complete the look", related and recently viewed items.
- Cart drawer and cart page, free-shipping progress bar, promo codes (`WELCOME10`, `FITROOM15`).
- Wishlist.
- Checkout with validation (card numbers checked with the Luhn algorithm; try `4242 4242 4242 4242`), standard or express shipping, card or cash on delivery, and an order confirmation page.
- English and Arabic with full right-to-left layout, light and dark theme, responsive down to phone width.
- Cart, wishlist, measurements, orders and the fitting-room outfit are saved in the browser (`localStorage`).

This is a demo store: no real payment is taken. Product imagery is generated as SVG, and garments share a body coordinate system with the models (see `src/lib/body.ts`). That lets one drawing serve as both the catalogue image and a transparent try-on layer.

## Getting started

```bash
npm install      # also copies MediaPipe's WASM runtime into public/mediapipe
npm run dev      # http://localhost:3000 → redirects to /en
```

```bash
npm run build && npm start
npm run lint
npm run typecheck
```

Camera features need a secure context: `localhost` or HTTPS.

## Project layout

```
src/
  app/[lang]/           pages (home, shop, product/[slug], fitting-room, cart, wishlist, checkout)
  app/api/try-on/       optional AI try-on proxy (FASHN)
  components/fitting/   fitting room: stage, camera capture, AI panel
  lib/body.ts           reference body joints shared by garments and models
  lib/garments.ts       procedural garment SVGs
  lib/avatars.ts        built-in fitting-room models
  lib/fit.ts            maps a garment onto detected or known joints
  lib/pose.ts           MediaPipe pose detection (image + live video)
  lib/sizing.ts         size recommendation
  lib/products.ts       catalogue (EN/AR)
  lib/i18n.ts           dictionaries, locale helpers
  lib/store.ts          cart, wishlist, profile, orders, outfit (zustand, persisted)
  proxy.ts              redirects / to the preferred locale
```
