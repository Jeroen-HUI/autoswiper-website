# AutoSwiper — Marketing Website

The static marketing site for the AutoSwiper app. Plain HTML/CSS/JS — **no build step** —
so it can be hosted anywhere (GitHub Pages, Netlify, Vercel, Cloudflare Pages…).

The design mirrors the app itself: a monochrome palette with a built-in light/dark
theme that matches the app's own theming, the real swipe-card layout, and the
in-app market-price meter.

## Files

```
website/
├── index.html        ← Landing page (light/dark, app-accurate UI)
├── privacy.html      ← Privacy Policy (tailored to the app)
├── terms.html        ← Terms of Service (tailored to the app)
├── CNAME             ← Custom domain (www.useautoswiper.com)
└── assets/
    ├── styles.css     ← All styling + theme tokens
    ├── main.js        ← Theme toggle (persisted) + small enhancements
    └── icon.png       ← Logo / favicon (the app icon)
```

## Preview locally

Open `index.html` directly, or serve the folder:

```bash
# from inside the website/ folder
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy with GitHub Pages

This repo is already wired to `github.com/Jeroen-HUI/autoswiper-website`.

1. **Settings → Pages → Source: Deploy from a branch**, pick `main`, folder `/ (root)`.
2. The custom domain `www.useautoswiper.com` is set via the `CNAME` file. Point your
   DNS at GitHub Pages, then enable **Enforce HTTPS** once it verifies.

Publishing an update is just:

```bash
git add .
git commit -m "Update website"
git push
```

## Things to update before launch

- **Store links:** the App Store / Google Play buttons point to `#`. Replace the
  `href="#"` values in `index.html` once your store listings are live.
- **Governing law:** `terms.html` currently names the Netherlands — confirm this
  matches your registered entity / jurisdiction.
- **Brand name:** the site uses "AutoSwiper" (matching the domain). The app's
  internal name is "AutoSwipe" — change if you want them to match.
