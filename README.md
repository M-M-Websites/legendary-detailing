# Legendary Detailing: Website

Premium, fully responsive website for **Legendary Detailing**, a mobile auto detailing business in **Memphis, Tennessee**. The copy, service-area section and search data all target customers in the Memphis area.

- **Preview:** https://michaelabatetsu.github.io/legendary-detailing/
- **Stack:** hand-built HTML, CSS and vanilla JavaScript. There's no framework and no build step, so any static host can serve it as-is.
- **Quality checks:**
  - Lighthouse scores 100 for Accessibility, Best Practices and SEO.
  - Performance is 99 on desktop and 91+ on mobile with simulated slow 4G.
  - axe-core finds no accessibility violations.
  - A 27-test regression suite is included (see *Testing*).

---

## SEO

The full SEO guide is in **[docs/SEO.md](docs/SEO.md)**. It covers what's optimized, how to set up Google Search Console, Google Business Profile and analytics, what the owner still needs to confirm, and the final audit. A monthly reporting template is in [docs/seo-monthly-report.md](docs/seo-monthly-report.md).

## Launch checklist (about 15 minutes)

1. **Host it.** Pick one:
   - **Netlify:** *Add new site → Import from Git →* pick this repo. Leave the build command empty and set the publish directory to `/`.
   - **Cloudflare Pages:** *Create → Pages → Connect to Git →* pick this repo. Framework preset: None. Build command: empty. Output directory: `/`.

   Both hosts read the included `_headers` file, which sets caching and security headers. GitHub Pages also works, but GitHub's terms say Pages isn't intended for running a business's website.
2. **Connect the domain** in the host's *Domains* settings and follow its DNS instructions.
3. **Point the site at the domain.** From this folder, run:
   ```bash
   bash scripts/set-domain.sh yourdomain.com
   ```
   Then commit and push. This updates the share-preview URLs, the canonical URL, the sitemap, robots.txt, the 404 page and `CNAME`. It's safe to run again if the domain changes.
4. **Activate the booking form (one time).** Submit one test request on the live site. FormSubmit then emails **xavierwade38@gmail.com** an *Activate Form* link; click it. From then on, every request arrives in that inbox as a formatted email, and Reply goes straight to the customer when they gave an email address. Until activation, visitors see a message asking them to call, text or email instead, so no lead is lost.
   - Have the owner mark the first FormSubmit email *Not spam* so later requests land in the inbox.
   - *Optional:* after activation, FormSubmit offers a random alias. Put it in place of the email address in the form's `action` in `index.html` to hide the address from spam bots.
5. **Submit the sitemap** in Google Search Console (`https://yourdomain.com/sitemap.xml`). See [docs/SEO.md](docs/SEO.md) for the full Search Console and Google Business Profile steps.

Everything else on the site is complete. The owner-specific content below has a place ready and turns on by itself once it's filled in.

---

## Editing the site

### Reviews, social links, hours and analytics → `assets/js/content.js`
This is the only file the owner needs to touch.
- **Business hours (`LD_HOURS`):** once filled in, the hours appear in the footer and are added to Google's structured data automatically.
- **Analytics (`LD_ANALYTICS`):** turns on cookieless Plausible or GoatCounter tracking for visits, phone, text and email clicks, and booking requests. See docs/SEO.md.
- **Social links (`LD_SOCIAL`):** paste the full Instagram, Facebook, TikTok or Google Business Profile URLs. Their icons appear in the footer automatically.
- **Reviews:** add real customer reviews only, word for word. The *What our clients are saying* section stays hidden until at least one exists, so the site never shows an empty or fake review block. Fake reviews are illegal under the FTC rule that took effect October 2024.
- To preview the review layout without publishing anything, open the site with `?editor` at the end of the address.

### Prices and packages → `index.html`
Prices match the business flyer. Each one appears in three places, so update all three:
1. The **services section**: `<article class="pkg">` blocks, `.pkg__amount`.
2. The **booking form**: the matching `<input ... data-price="">`. The live price estimate reads this.
3. The **FAQ** answer *How much does a detail cost?* and the `hasOfferCatalog` block in the JSON-LD at the top of the file.

`data-suv="20"` on a package adds the SUV/truck surcharge to the estimate. `data-includes` lists add-ons that a package already includes.

### Memphis service area
- **Neighborhood list:** in `index.html`, in the *Service area* section (`.area__list`) and the FAQ answer *What areas of Memphis do you serve?*. Keep both in sync.
- **ZIP check:** the booking form gently flags ZIP codes outside the Memphis area (anything other than Memphis `381xx` and the Shelby County ZIPs listed in the code). It never blocks a request. The rule is in `assets/js/main.js` under "Soft Memphis-area hint".
- **Search data:** the title, meta description, `geo.*` tags and the JSON-LD `address` and `areaServed` name Memphis, TN. There's no street address, because the business comes to the customer.

### Gallery photos
1. Put the photo in `assets/img/` (WebP, about 1200px wide).
2. In `index.html`, copy a `<figure class="tile">` block inside `#gallery`, then update `data-full`, `src`, `alt` and the caption.
3. When before/after photos of the **same** vehicle become available, add them as neighbouring tiles with honest captions.

### Phone number, email or colours
- **Phone and email:** search `index.html` for `483-8862`, `+19014838862` and `xavierwade38@gmail.com`. The `BUSINESS` constant at the top of `assets/js/main.js` holds them too.
- **Colours:** brand tokens are at the top of `assets/css/styles.css` (`--gold`, `--black`, `--charcoal` and others).

---

## What's on the page

| Section | Notes |
|---|---|
| Sticky navigation | Home, Services, Our Work, About, Contact, plus a gold **Book Now** button. Includes a scroll progress bar, the active section highlighted, a tap-to-call icon and an animated full-screen menu on phones |
| Hero | Real customer car photo. One signature moment: the headline rises in, then a gloss light sweeps across the letters and the paint, like a detailer's inspection light |
| Tagline band | *Cleaner. Shinier. Legendary.* from the flyer, on a slow marquee that pauses on hover |
| About | Mobile service, premium products, attention to detail and satisfaction guaranteed, all taken from the flyer |
| Services | Spec-sheet price list: Exterior Wash $20, Interior Detail $45, Full Detail $80, Full Detail Package $120, add-ons, and Custom Detailing. The "Book" buttons pre-select the package in the form |
| Our Work | Editorial gallery with a squeegee-style gold-edge reveal and a full-screen viewer (keyboard, swipe, focus trap) |
| Why Legendary / Process | Four reasons and a three-step process with an animated connecting line |
| Service area | Giant outlined "901", Memphis neighborhoods, a note for customers outside Memphis, and Book/Call buttons |
| Reviews | Hidden until real reviews are added to `content.js` |
| Booking | Two-step request form: (1) package, vehicle type, add-ons with a live price estimate; (2) contact details and timing. Inline validation, a summary before sending, an animated confirmation, and call/text/email fallbacks |
| FAQ | Animated accordion: booking, mobile service, services, pricing, timing, what to include |
| Footer | Brand, call, text and email links, quick links, auto-updating copyright year |
| Phone quick bar | Call, Text and Book; appears after the hero and hides at the form |

Accessibility and fallbacks:
- **Reduced motion:** visitors who ask their device for less motion get a still page.
- **No JavaScript:** everything still shows, and the form submits with the browser's own validation.
- **Keyboard:** the booking form works fully from the keyboard.

---

## Design system and UI polish

The site follows a 100-point UI checklist (spacing, typography, colour, controls, forms, motion, loading states, microcopy, mobile and accessibility). The main pieces:
- **Tokens** at the top of `assets/css/styles.css`:
  - a spacing scale (`--space-1` to `--space-9`)
  - layered two-part shadows (`--shadow-1` to `--shadow-3`) and a gold glow
  - motion durations (`--dur-fast`, `--dur`)
  - greys tinted toward the brand gold
- **Type:**
  - tightened large headings and balanced or pretty line wrapping
  - tabular digits on every price
  - curly quotes and en dashes in all visible copy
- **Controls:**
  - one-line button labels, a pressed state (scale 0.97) and a disabled state
  - balanced padding on buttons with an icon
  - 44px tap targets throughout
- **Form:**
  - validates when you leave a field, then live once there's an error
  - a 4px shake on errors, error icons, and errors linked to fields for screen readers
  - chips for preferred time
  - double-submit protection with "Sending…" and "Still sending…" progress text
  - a retry button that keeps everything entered
  - a personal thank-you ("Thanks, Jordan.") that says what happens next
- **Motion:**
  - only transform and opacity are animated, with a 50ms stagger
  - hover scales stay at 1.03–1.04
  - FAQ answers fade and rise in
  - the hero copy drifts and fades as you scroll
- **Eye candy:**
  - a static film-grain texture and a soft gold glow behind the hero headline
  - metallic-gold prices
  - a cursor spotlight on cards and a subtle 3D tilt on gallery photos (mouse and trackpad only)
  - shimmering placeholders in each photo's own colour while images load

Everything that moves is switched off for visitors who ask their device for reduced motion.

## Testing

```bash
cd tests
npm install
npx playwright install chromium
npm test
python3 validate_structured_data.py
```

The suite covers:
- **Layout:** six screen sizes from 320px to 1920px, with no sideways scrolling and no broken images or console errors.
- **Content:** every phone, text and email link, prices, structured data, and navigation.
- **Booking form:** the price estimate, two-step validation, payload contents, and both success and failure paths. FormSubmit is mocked, so tests never send real email.
- **Interactive parts:** the gallery viewer, the mobile menu and quick bar, the FAQ, and `content.js` reviews and socials.
- **SEO:** one H1, the required H2s with no skipped levels, 80–150-word service guides, alt text, calls to action, robots/canonical/Open Graph, and structured data (`validate_structured_data.py` checks it against the schema.org vocabulary).
- **Analytics:** phone, text, email and book clicks, plus booking results, raise tracking events.
- **Accessibility:** axe-core checks plus keyboard use.
- **Fallbacks:** no JavaScript, reduced motion, the Content-Security-Policy from `_headers`, and the 404 page.

## Files

```
index.html            the page
404.html              branded not-found page
assets/css/styles.css all styles and design tokens
assets/js/main.js     interactions, animation, booking form
assets/js/content.js  reviews and social links (owner-editable)
assets/img/           photos (responsive sizes), logo, icons
assets/fonts/         Saira variable font, self-hosted (SIL Open Font License, see OFL.txt)
_headers              caching and security headers for Netlify and Cloudflare Pages
scripts/set-domain.sh switches all URLs to the custom domain
tests/                regression suite
```

## Credits

- **Photography:** Legendary Detailing's own work.
- **Logo:** from the Legendary Detailing flyer, recoloured to the site's gold. The original red version is `assets/img/logo-original.png`.
- **Typeface:** Saira by Omnibus-Type (SIL OFL 1.1).
