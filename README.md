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
├── invite/
│   └── index.html    ← Invite landing (opens app / store fallback)
├── .well-known/
│   ├── assetlinks.json                  ← Android App Links verification
│   └── apple-app-site-association       ← iOS Universal Links (update TEAMID)
├── privacy.html      ← Privacy Policy (tailored to the app)
├── terms.html        ← Terms of Service (tailored to the app)
├── CNAME             ← Custom domain (useautoswiper.com)
└── assets/
    ├── styles.css     ← All styling + theme tokens
    ├── main.js        ← Theme toggle (persisted) + small enhancements
    ├── config.js      ← Supabase + store URLs
    ├── invite.js      ← Invite page logic
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
   DNS at GitHub Pages (www → `jeroen-hui.github.io`, apex → GitHub A records), then enable **Enforce HTTPS** once it verifies.

Publishing an update is just:

```bash
git add .
git commit -m "Update website"
git push
```

## Things to update before launch

- **Store links:** update `assets/config.js` (`playStoreUrl`, `appStoreUrl`) when listings go live.
- **iOS Universal Links:** replace `TEAMID` in `.well-known/apple-app-site-association` with your Apple Team ID (find it in [Apple Developer](https://developer.apple.com/account) → Membership, or Expo credentials after iOS setup).
- **Invite links:** shared from the app as `https://www.useautoswiper.com/invite?code=XXXX`. Deploy this site so `/invite` and `.well-known/*` are live.
- **Governing law:** `terms.html` currently names the Netherlands — confirm this
  matches your registered entity / jurisdiction.
- **Brand name:** the site uses "AutoSwiper" (matching the domain). The app's
  internal name is "AutoSwipe" — change if you want them to match.
