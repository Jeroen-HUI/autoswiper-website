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
├── app-ads.txt       ← AdMob app-ads.txt (required for ad verification)
├── CNAME             ← Custom domain (www.useautoswiper.com)
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

### HTTPS not working? (Certificate Request Error)

If GitHub Pages shows **TLS certificate provisioning failed** or browsers get a certificate
error for `*.github.io` instead of your domain, the website files are usually fine — the
blocker is almost always **broken DNSSEC** on the domain.

**Verify:** open [Google DNS lookup for DS record](https://dns.google/query?name=useautoswiper.com&type=DS).
If you see a DS record and `DNSSEC validation failure` for A/CNAME lookups, that's the problem.

**Fix at Namecheap:**
1. Domain List → **Manage** → **Advanced DNS**
2. Find **DNSSEC** and turn it **Off** (or delete any DS records)
3. If DS records still appear in the Google lookup after 24h, open a Namecheap support ticket
   and ask them to **remove the DS record at the .com registry** — toggling DNSSEC off in
   the panel does not always delete the registry DS entry.

**Required DNS records (must match GitHub Pages docs):**

| Host | Type  | Value                 |
|------|-------|-----------------------|
| `@`  | A     | `185.199.108.153`     |
| `@`  | A     | `185.199.109.153`     |
| `@`  | A     | `185.199.110.153`     |
| `@`  | A     | `185.199.111.153`     |
| `www`| CNAME | `jeroen-hui.github.io.`|

After DNSSEC is fixed, go to **GitHub → repo Settings → Pages**, remove the custom domain,
wait one minute, re-add `www.useautoswiper.com`, then wait up to 15 minutes for the cert.

**Current repo config (already correct):**
- `CNAME` file: `www.useautoswiper.com`
- `.nojekyll` present (allows `.well-known/` to be served)
- No mixed-content or HTTPS-breaking settings in the HTML

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
- **AdMob `app-ads.txt`:** after deploy, verify `https://www.useautoswiper.com/app-ads.txt` loads in a browser. The domain must match **exactly** what is listed as your developer website in Google Play (and App Store Connect for iOS).
- **Governing law:** `terms.html` currently names the Netherlands — confirm this
  matches your registered entity / jurisdiction.
- **Brand name:** the site uses "AutoSwiper" (matching the domain). The app's
  internal name is "AutoSwipe" — change if you want them to match.
