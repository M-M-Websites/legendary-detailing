# Legendary Detailing: SEO guide and audit

This covers what was optimized on the website, the steps that need someone's Google or domain access, and what's still waiting on the business owner. It applies to the one-page site in this repository: hand-built HTML/CSS/JS, no Framer.

**Service area:** Memphis, TN, as confirmed by the site's seller. Local keywords target Memphis only. No pages exist for other cities, and the site lists no street address, because Legendary Detailing is a mobile service.

> No SEO change can guarantee rankings, traffic or customers. Everything here improves eligibility and relevance for detailing searches. Results have to be measured in Google Search Console after launch.

---

## 1. Completed (built into the website)

### Homepage metadata
| Item | Value |
|---|---|
| Title | `Legendary Detailing \| Professional Auto Detailing in Memphis, TN` (64 characters) |
| Meta description | `Professional interior and exterior car detailing in Memphis, TN. Explore Legendary Detailing services, view our work, and request a detailing appointment today.` (160 characters) |
| Robots | `index, follow, max-image-preview:large`, with no `noindex` anywhere |
| Canonical | Absolute HTTPS URL. `scripts/set-domain.sh` switches it to the custom domain |
| Social preview | Open Graph title, description, image (1200×630) and image alt text; Twitter large card |
| Language and region | `lang="en"`, `og:locale en_US`, `geo.region US-TN`, `geo.placename Memphis` |

### Heading structure
There is exactly **one H1** (*Professional Auto Detailing in Memphis, TN \| Legendary Detailing*). It sits in the hero where the small gold line used to be, so the design hasn't changed. **"Every Detail. Legendary Results."** stays the large visual tagline.

The required H2s are in place. The original display lines stay underneath them as taglines:
- **Professional Interior & Exterior Detailing** (tagline: *Not just clean. Legendary.*)
- **Our Auto Detailing Services**
- **See Our Detailing Work** (tagline: *The results speak for themselves.*)
- **Why Choose Legendary Detailing?**
- **Request Your Detailing Appointment** (tagline: *Your next detail starts here.*)

Other H2s: *Mobile detailing across Memphis*, *The Legendary experience*, *Questions, answered.* H3s sit under their H2s, and an automated test checks that no heading level is skipped.

### Service content
A service guide sits under the price list, with 80–150 words per service. A test enforces that range.
- **Interior car detailing**
- **Exterior car detailing**
- **Complete auto detailing**
- **Custom detailing quotes**

All four use only the package inclusions on the business's flyer. There are no invented methods, chemicals, coatings or equipment. Each ends with a link that pre-selects that package in the booking form.

### Keyword placement (natural, no stuffing)
| Keyword | Where it appears |
|---|---|
| Professional auto detailing (+ Memphis) | Title, H1, structured data |
| Interior / exterior car detailing | Meta description, H2, service guide H3s, image alt text |
| Full service / complete auto detailing | Service guide H3, structured data `serviceType` |
| Car detailing quotes / services | "Custom detailing quotes", "Request a Quote" buttons, FAQ |
| Auto detailing appointments | H2 "Request Your Detailing Appointment", form copy |
| Memphis, TN | Title, H1, description, hero, service-area section, FAQ, footer, structured data |

### Image SEO
- **Alt text:** every photo has alt text that describes only what it shows, for example *"Professionally detailed deep red Infiniti convertible with a mirror-like gloss finish, by Legendary Detailing"*. The booking-section background is decorative, so its alt is empty (`alt=""`).
- **File names:** descriptive, such as `audi-r8-v10-…`, `porsche-macan-…` and `infiniti-convertible-…`.
- **Delivery:** responsive WebP sizes (480, 720, 828, 1200 and full) through `srcset`/`sizes`. Below-the-fold images lazy-load, `width`/`height` are set so nothing shifts while loading (CLS = 0), and the hero image is preloaded.

### Structured data (JSON-LD)
- **Types:** a `@graph` holding a `WebSite`, an `AutomotiveBusiness` and a `FAQPage`.
- **FAQ:** the `FAQPage` repeats the visible *Questions, answered.* section word for word (plain text, links dropped). If you edit a question or answer in `index.html`, edit the matching JSON-LD entry too; a test fails if they differ.
- **Business details:** name, phone `+1-901-483-8862`, email, URL, logo, image, slogan, and a `ContactPoint`.
- **Location:** Memphis/TN `address` with no street, and `areaServed` Memphis.
- **Prices:** `priceRange`, plus an `OfferCatalog` of the five services with their flyer prices.
- **Added automatically once filled in `assets/js/content.js`:** `sameAs` (Google Business Profile and social links) and `openingHoursSpecification` (hours).
- **Never included:** ratings, reviews or a street address.
- **Validated** offline against the official schema.org vocabulary (`tests/validate_structured_data.py`): every type and property is valid.

### Technical
- **Crawling:** `robots.txt` allows crawling, keeps `/tests/`, `/scripts/` and `/docs/` out, and lists the sitemap. `sitemap.xml` is present (one URL, because it's a one-page site).
- **Links:** all navigation and in-page links resolve (tested), and there is no duplicate content.
- **Mobile:** responsive from 320px to 1920px with no sideways scrolling (tested at six widths).
- **Lighthouse (mobile, simulated slow 4G):**
  - Performance 91, Accessibility 100, Best Practices 100, **SEO 100**
  - LCP 3.5 s, CLS 0, TBT 50 ms
- **Lighthouse (desktop):**
  - Performance 99, Accessibility 100, Best Practices 100, **SEO 100**
  - LCP 0.9 s
- **Validation:** HTML validates with no errors (html-validate).

### Conversions and tracking
- **Calls to action:** *Book Your Detail*, *Request a Quote*, *Call Legendary Detailing* and *View Our Work* buttons, plus Text-us links and a sticky phone bar.
- **Contact links:** every phone link is `tel:+19014838862`, every email link is `mailto:xavierwade38@gmail.com`, and every text link is `sms:+19014838862` (tested).
- **Form:** a two-step booking form near the top of the booking section. It confirms success only after FormSubmit reports that the message was delivered. Otherwise it shows call, text and email alternatives.
- **Tracking events, ready to go:**
  - `Phone click`
  - `Text click`
  - `Email click`
  - `Book button click`
  - `Booking request sent`
  - `Booking request failed`

  Each event includes where on the page it happened. Events go to Plausible or GoatCounter when one is configured. Both are cookieless and need no cookie banner. Events also fire as a browser `ld:track` event for any other tool.

---

### AI search and fast indexing
- **`llms.txt`** at the site root: a plain-text summary of the services, starting prices, service area and booking options for AI assistants (ChatGPT, Gemini, Claude, Perplexity). It uses only facts already on the page; update it whenever prices or the service area change. `scripts/set-domain.sh` rewrites its URLs.
- **IndexNow key** (`c2d25c3e3eb276113cad85d385c0b119.txt` at the root) lets Bing, Yandex and other IndexNow engines be told about changed pages. With Cloudflare, turn on *Caching → Configuration → Crawler Hints* to submit changes automatically. Google ignores IndexNow; it uses the sitemap.
- **Cloudflare settings for AI visibility:** *Security → Settings → Bot traffic*: AI crawler access set to *Allow* for Search and Agents, and the managed robots.txt option off, so Cloudflare doesn't add lines blocking AI crawlers.

## 2. Manual actions required

| # | Task | Who / access needed |
|---|---|---|
| 1 | **Host on HTTPS and connect the domain.** Netlify or Cloudflare Pages issue HTTPS certificates automatically. Then run `bash scripts/set-domain.sh yourdomain.com`, commit and push. That updates the canonical, Open Graph, structured data, sitemap and robots URLs. | Domain registrar and hosting account |
| 2 | **Redirect the preview.** Once the domain is live, turn off GitHub Pages (repo *Settings → Pages*) so the `github.io` copy doesn't compete with the real domain. | GitHub repo owner |
| 3 | **Activate the booking form:** submit one test request, then click *Activate* in the FormSubmit email. | Owner's inbox (xavierwade38@gmail.com) |
| 4 | **Set up Google Search Console** (steps below). | Owner's Google account plus DNS access |
| 5 | **Create or claim the Google Business Profile** (steps below). | Owner's Google account; video verification |
| 6 | **Validate structured data on Google:** run the live URL through [Rich Results Test](https://search.google.com/test/rich-results) and the [Schema Markup Validator](https://validator.schema.org/). Expect "valid, no rich result types", which is normal for a local business page. | Anyone |
| 7 | **Turn on analytics (optional):** see *Analytics setup* below. | Plausible or GoatCounter account |
| 8 | **Bing Webmaster Tools (optional):** *Import from Google Search Console* copies everything in one click. | Same Google account |

### Google Search Console: step by step
1. **Verify ownership.** At [search.google.com/search-console](https://search.google.com/search-console), add a **Domain property** (`yourdomain.com`) and add the TXT record Google gives you at your domain registrar. *Needs registrar/DNS access.*
2. **Submit the sitemap.** Go to *Sitemaps* and submit `https://yourdomain.com/sitemap.xml`.
3. **Inspect the homepage.** Use *URL Inspection* on `https://yourdomain.com/` and check "URL is on Google" or "URL can be indexed".
4. **Request indexing** from the same screen after launch, and again after big content changes. Don't repeat it daily.
5. **Monitor indexing:** check *Pages* (indexing report) monthly for errors such as "Duplicate without user-selected canonical" or "Crawled – currently not indexed".
6. **Watch impressions and clicks:** *Performance → Search results*, last 28 days compared with the previous period.
7. **Track search queries:** the *Queries* tab in the Performance report shows the actual searches that showed or brought visitors to the site. Filter by "detailing" or "Memphis".

Tip: add the owner's Google account as an **Owner** in Search Console and keep yours as a **Full user**, so the business keeps control.

### Google Business Profile: step by step
1. At [business.google.com](https://business.google.com), create **Legendary Detailing** with the primary category **Car detailing service**.
2. Choose *"I deliver goods and services to my customers"* and **hide the address**, since this is a mobile business. Add **Memphis, TN** and nearby areas he actually serves as the service area.
3. Enter the same name, phone `(901) 483-8862`, website URL and hours used on the website, so all listings match.
4. Complete video verification: one continuous take showing the location, the work equipment and proof of running the business.
5. Add the photos from the website and new before/after shots taken from now on.
6. Copy the profile's share link into `google` in `assets/js/content.js`. It then appears in the footer, on "Read all reviews", and in the structured data `sameAs`.
7. Ask every customer for a review with the profile's review link. Never offer incentives or pick only happy customers (Google policy and the FTC rule on reviews).

### Analytics setup (privacy-friendly, no cookies)
- **Plausible** (paid, simplest):
  1. Add the domain at plausible.io.
  2. In `assets/js/content.js` set `LD_ANALYTICS = { provider: "plausible", siteId: "yourdomain.com" }`.
  3. In Plausible, add **goals** with these exact names: `Phone click`, `Text click`, `Email click`, `Book button click`, `Booking request sent`.
- **GoatCounter** (free for small sites):
  1. Create a site code at goatcounter.com.
  2. Set `LD_ANALYTICS = { provider: "goatcounter", siteId: "yourcode" }`.
  3. Events appear as paths starting `event-`.

`_headers` already allows both services in the Content-Security-Policy.

---

## 3. Awaiting business confirmation

| Item | Where it goes once confirmed |
|---|---|
| **Neighborhoods actually served.** The site lists Downtown, Midtown, East Memphis, Cordova, Whitehaven, Raleigh, Hickory Hill and Frayser; confirm or edit. | `index.html`: `.area__list` and the FAQ answer |
| **Business hours** | `LD_HOURS` in `assets/js/content.js` (footer and structured data update automatically) |
| **Google Business Profile link** | `google` in `LD_SOCIAL` |
| **Instagram / Facebook / TikTok** | `LD_SOCIAL` |
| **Verified customer reviews** (real, word for word) | `LD_REVIEWS`; the section appears automatically |
| **Prices and inclusions.** Currently copied from his flyer; confirm they're current. | Services section, form `data-price`, FAQ, JSON-LD |
| **Whether (901) 483-8862 accepts texts** | Remove the `sms:` links if not |
| **Final domain name** | `scripts/set-domain.sh` |

---

## 4. Final SEO audit checklist

| # | Check | Result |
|---|---|---|
| 1 | Homepage metadata | ✅ Title, description, robots, canonical, Open Graph present (automated test) |
| 2 | Headings and service content | ✅ One H1, the five required H2s, no skipped levels, guides 80–150 words (automated test) |
| 3 | Image descriptions | ✅ All images have alt text; decorative image `alt=""` (automated test and Lighthouse) |
| 4 | Contact links | ✅ All `tel:`, `sms:` and `mailto:` links correct (automated test) |
| 5 | Mobile responsiveness | ✅ 320–1920px with no overflow (automated test); quick-bar tap targets ≥ 44px (automated test); Lighthouse accessibility 100 |
| 6 | Loading performance | ✅ Lighthouse mobile 91 / desktop 99, CLS 0 |
| 7 | Indexing settings | ✅ No `noindex`; robots.txt allows the site |
| 8 | Sitemap after publishing | ⏳ Present in the repo; confirm `https://yourdomain.com/sitemap.xml` loads and submit it in Search Console |
| 9 | Structured data validity | ✅ Valid against the schema.org vocabulary; ⏳ run Google's Rich Results Test on the live URL |
| 10 | Remaining manual steps | See *Manual actions required* and *Awaiting business confirmation* above |

Re-run everything with `cd tests && npm test && python3 validate_structured_data.py`.

---

## 5. Monthly reporting

Use [`seo-monthly-report.md`](seo-monthly-report.md). Every number in it comes from Search Console or the analytics tool. Leave a cell blank rather than estimate.
