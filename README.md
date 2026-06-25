# AutoSwipe — Marketing Website

A static landing page for the AutoSwipe app. Plain HTML/CSS/JS — **no build step**,
so it can be hosted anywhere (GitHub Pages, Netlify, Vercel, Cloudflare Pages…).

## Files

```
website/
├── index.html        ← Landing page
├── privacy.html      ← Privacy Policy (required for app store listings)
├── terms.html        ← Terms of Service
└── assets/
    ├── styles.css     ← All styling (matches the app's dark + coral-red theme)
    ├── main.js        ← Tiny enhancements (sticky nav, year)
    └── icon.png       ← Logo / favicon (copied from the app icon)
```

## Preview locally

Just open `index.html` in a browser, or serve the folder:

```bash
# from inside the website/ folder
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy with GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, pick **Deploy from a branch**.
4. Choose your branch (e.g. `main`) and set the folder to **`/website`**
   (or move the contents to `/docs` / repo root if you prefer those options).
5. Save. Your site goes live at `https://<username>.github.io/<repo>/` in a minute.

> Tip: For a custom domain (e.g. `autoswipe.app`), add it under
> **Settings → Pages → Custom domain** and create a `CNAME` DNS record at your registrar.

## Things to update before launch

- **Store links:** the App Store / Google Play buttons currently point to `#`.
  Replace the `href="#"` values in `index.html` once your listings are live.
- **Contact email:** `support@autoswipe.app` is used in the footer and legal pages.
- **Stats:** the "10k+ listings" strip uses placeholder numbers — tweak to taste.
