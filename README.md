# Legendary Detailing — Website

Premium, fully responsive marketing website for **Legendary Detailing**, a professional automotive detailing business.

**Live site:** https://michaelabatetsu.github.io/legendary-detailing/

Built as a fast, dependency-free static site (HTML + CSS + vanilla JS). There's no build step, so it can be hosted anywhere: GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any web host.

---

## What's included

| Section | Notes |
|---|---|
| Sticky navigation | Gold **Book Now** button, a tap-to-call icon and full-screen menu on mobile, and active-section highlighting |
| Cinematic hero | Uses the business's own Infiniti photo, "Every Detail. Legendary Results." |
| About | "Not just clean. Legendary." with the Porsche Macan photo |
| Services | Exterior, Interior, Full Vehicle, and Custom Detailing. Shows "Contact for Pricing". **Request a Quote** pre-selects the service in the form |
| Our Work | Editorial gallery of the client's photos with a full-screen viewer (keyboard and swipe) |
| Why Legendary | Four feature cards with gold icons |
| The Legendary Experience | Three-step process with an animated connecting line |
| Client Reviews | Shows **only verified reviews** from `assets/js/reviews.js`. While that list is empty, visitors see an invitation to share feedback |
| Appointment Request | Full booking form that delivers to `xavierwade38@gmail.com`, plus a separate call button |
| FAQ | Accessible accordion, with factual answers only |
| Footer | Brand, contact, quick links, social placeholders, auto-updating copyright year |
| Mobile quick bar | Persistent **Call** / **Book** bar on phones |

SEO: title, meta description, Open Graph image, and `AutomotiveBusiness` structured data. No city is listed until the service area is confirmed.

---

## ⚠️ Before launch checklist

1. **Activate the booking form (one time, about 1 minute).**
   The form uses [FormSubmit](https://formsubmit.co), a free service that emails each submission to `xavierwade38@gmail.com`.
   - Submit the form once on the live site.
   - FormSubmit sends an **"Activate Form"** email to xavierwade38@gmail.com. Click the button in that email.
   - Every request after that arrives in the inbox as a formatted email. Reply-to is set to the customer's email address.
   - *Optional:* after activation, FormSubmit gives you a random alias string. Replace the email in the form's `action` attribute in `index.html` with that alias so the address isn't exposed to spam bots.
   - *CC a second inbox:* add `<input type="hidden" name="_cc" value="other@email.com">` inside the form.
2. **Confirm the service location.** Once it's known, add the city or area to the `<title>`, the meta description, and the JSON-LD block in `index.html`.
3. **Add social links.** In the footer, replace `href="#"` on the Instagram and Facebook icons with the real URLs and remove the `data-placeholder` attribute.
4. **Add verified reviews** as they come in (see below).

---

## How to edit

### Phone number or email
Search `index.html` for `483-8862` / `+19014838862` and `xavierwade38@gmail.com`. Also update the two constants at the top of `assets/js/main.js`.

### Reviews (verified only)
Open `assets/js/reviews.js` and add an entry:

```js
window.LD_REVIEWS = [
  { name: "Jordan M.", vehicle: "2021 Audi R8", rating: 5, text: "Exact words from the customer.", source: "Google" },
];
```

To preview the review card layout without publishing anything, open the site with `?editor` at the end of the URL (for example `…/legendary-detailing/?editor`). The placeholder cards are only visible in that mode.

### Gallery photos
1. Put the photo in `assets/img/`. WebP at about 1200px wide is ideal.
2. In `index.html`, copy one `<figure class="tile">…</figure>` block inside `#gallery`, then update `data-full`, the `src`, the `alt` text, and the caption.
   - `tile--tall` makes a tall feature tile, `tile--wide` a landscape tile.

### Services
Each service is an `<article class="service">` block in `index.html`. Edit the image, title, or description, or copy a block to add a new service. If you add a service, also add it to the `<select id="f-service">` options in the form.

### Brand colors
All colors are CSS variables at the top of `assets/css/styles.css` (`--gold`, `--black`, `--charcoal`, and others).

---

## Photo assets

All photography comes from Legendary Detailing's own work:

- `infiniti-convertible-*`: hero, gallery, exterior service card (detail crop)
- `audi-r8-v10-*`: gallery, booking background, interior and custom service cards (detail crops)
- `porsche-macan-*`: about section, gallery, full detail service card
- `logo-gold.*`: the Legendary Detailing wordmark from the business's flyer, recolored from red to the site's gold palette. The unmodified red version is saved as `logo-original.png`.

Detail tiles such as wheels and paint close-ups are tighter crops of those same photos. No before/after pairs are implied.

---

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

The site deploys with **GitHub Pages** from the `main` branch root. To move it to a custom domain, add a `CNAME` file containing the domain and point DNS at GitHub Pages, or drag the folder into Netlify or Cloudflare Pages.
