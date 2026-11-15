/* Legendary Detailing: regression test suite
 * Run:  cd tests && npm install && npx playwright install chromium && npm test
 * Starts a local static server for the site and checks layout, content, links,
 * the booking flow, the gallery viewer, accessibility (axe-core) and fallbacks.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const AXE = require.resolve('axe-core/axe.min.js');
const PHONE_TEL = 'tel:+19014838862';
const EMAIL = 'xavierwade38@gmail.com';
const CSP = (fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];

/* ---------- tiny test runner ---------- */
const results = [];
let current = '';
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (a, b, msg) => assert(a === b, `${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
async function test(name, fn) {
  current = name;
  const t0 = Date.now();
  try { await fn(); results.push({ name, ok: true }); console.log(`  ✓ ${name} (${Date.now() - t0}ms)`); }
  catch (e) { results.push({ name, ok: false, err: e }); console.log(`  ✗ ${name}\n      ${e.message.split('\n').join('\n      ')}`); }
}

/* ---------- static server ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let file = path.join(ROOT, url.endsWith('/') ? url + 'index.html' : url);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404, { 'Content-Type': TYPES['.html'] });
        return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
      }
      const headers = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' };
      if (process.env.WITH_CSP && file.endsWith('.html') && CSP) headers['Content-Security-Policy'] = CSP;
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/* ---------- helpers ---------- */
async function openPage(browser, base, opts = {}, query = '') {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => { if (!r.url().includes('formsubmit.co')) problems.push(`requestfailed: ${r.url()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('formsubmit.co')) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(base + '/' + query, { waitUntil: 'networkidle' });
  return { ctx, page, problems };
}
const scrollThrough = (page) => page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 350) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); }
  window.scrollTo({ top: 0, behavior: 'instant' });
});
async function axe(page, label) {
  await page.addScriptTag({ path: AXE });
  const r = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const out = await axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
    return out.violations.map((v) => `${v.impact} ${v.id}: ${v.help} -> ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  });
  assert(r.length === 0, `axe violations (${label}):\n${r.join('\n')}`);
}
async function fillStep1(page, pkg = 'Full Detail', vehicle = 'SUV / Truck', addons = []) {
  await page.locator(`input[name="Package"][value="${pkg}"]`).check({ force: true });
  await page.locator(`input[name="Vehicle Type"][value="${vehicle}"]`).check({ force: true });
  for (const a of addons) await page.locator(`input[name="Add-ons"][value="${a}"]`).check({ force: true });
}
const estimate = (page) => page.locator('#estimate-value').textContent();

(async () => {
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  console.log(`\nLegendary Detailing test suite (${base})\n`);

  /* 1. Layout at every common screen size */
  const viewports = [
    ['phone 320', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }],
    ['iPhone 13', { ...devices['iPhone 13'] }],
    ['tablet 768', { viewport: { width: 768, height: 1024 } }],
    ['laptop 1024', { viewport: { width: 1024, height: 768 } }],
    ['desktop 1440', { viewport: { width: 1440, height: 900 } }],
    ['wide 1920', { viewport: { width: 1920, height: 1080 } }],
  ];
  for (const [name, opts] of viewports) {
    await test(`layout ${name}: loads cleanly, no sideways scroll, all images load`, async () => {
      const { ctx, page, problems } = await openPage(browser, base, opts);
      await scrollThrough(page);
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      eq(overflow, 0, 'horizontal overflow (px)');
      const broken = await page.evaluate(() => [...document.images].filter((i) => !i.closest('[hidden]') && i.id !== 'lightbox-img' && (!i.complete || i.naturalWidth === 0)).map((i) => i.src));
      eq(broken.length, 0, `broken images ${broken.join(', ')}`);
      eq(await page.locator('h1').count(), 1, 'exactly one h1');
      const tagline = await page.locator('.hero__title').innerText();
      assert(/every detail/i.test(tagline) && /legendary/i.test(tagline) && /results/i.test(tagline), `hero tagline wrong: ${tagline}`);
      assert(await page.locator('.hero__title').isVisible() && await page.locator('h1').isVisible(), 'h1 and tagline visible');
      // nothing important hidden behind the fixed nav or off-screen
      const offscreen = await page.evaluate(() => [...document.querySelectorAll('main a, main button')].filter((el) => {
        const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1);
      }).length);
      eq(offscreen, 0, 'controls outside the viewport');
      eq(problems.length, 0, `errors: ${problems.join('; ')}`);
      await ctx.close();
    });
  }

  /* 2. Content and links */
  await test('content: business details, prices and links are correct everywhere', async () => {
    const { ctx, page, problems } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    const html = await page.content();
    assert(!/455-9134|4559134/.test(html), 'old flyer phone number found');
    assert(!/lorem|placeholder text|TODO|FIXME/i.test(html.replace(/placeholder="[^"]*"/g, '')), 'leftover placeholder text');
    const tels = await page.$$eval('a[href^="tel:"]', (a) => [...new Set(a.map((x) => x.getAttribute('href')))]);
    eq(JSON.stringify(tels), JSON.stringify([PHONE_TEL]), 'tel links');
    const sms = await page.$$eval('a[href^="sms:"]', (a) => a.map((x) => x.getAttribute('href')));
    assert(sms.length >= 5 && sms.every((h) => h.startsWith('sms:+19014838862')), `sms links: ${sms}`);
    const mails = await page.$$eval('a[href^="mailto:"]', (a) => a.map((x) => x.getAttribute('href')));
    assert(mails.length >= 3 && mails.every((h) => h.startsWith(`mailto:${EMAIL}`)), `mailto links: ${mails}`);
    const action = await page.getAttribute('#booking-form', 'action');
    eq(action, `https://formsubmit.co/${EMAIL}`, 'form action');
    const missing = await page.$$eval('a[href^="#"]', (a) => a.map((x) => x.getAttribute('href')).filter((h) => h.length > 1 && !document.getElementById(h.slice(1))));
    eq(missing.length, 0, `in-page links with no target: ${missing}`);
    const prices = await page.$$eval('.pkg__amount', (n) => n.map((x) => x.textContent.trim()));
    eq(prices.join(','), '$20,$45,$80,$120', 'package prices');
    const addons = await page.$$eval('.addons__list strong', (n) => n.map((x) => x.textContent.trim()));
    eq(addons.join(','), '$20,$15,$15,+$25', 'add-on prices');
    const suvNotes = await page.$$eval('.pkg__note', (n) => n.length);
    eq(suvNotes, 2, 'SUV notes on Full Detail and Full Detail Package');
    eq(await page.title(), 'Legendary Detailing | Professional Auto Detailing in Memphis, TN', 'title');
    const desc = await page.getAttribute('meta[name="description"]', 'content');
    assert(/interior and exterior car detailing/i.test(desc) && /Memphis, TN/.test(desc) && desc.length <= 160, `meta description: ${desc}`);
    eq(await page.getAttribute('meta[name="geo.placename"]', 'content'), 'Memphis', 'geo.placename');
    const graph = JSON.parse(await page.$eval('script[type="application/ld+json"]', (s) => s.textContent))['@graph'];
    const ld = graph.find((n) => n['@type'] === 'AutomotiveBusiness');
    assert(ld && graph.find((n) => n['@type'] === 'WebSite'), 'WebSite + AutomotiveBusiness nodes');
    eq(ld.telephone, '+1-901-483-8862', 'schema phone');
    eq(ld.email, EMAIL, 'schema email');
    eq(ld.hasOfferCatalog.itemListElement.length, 5, 'schema offers');
    assert(!('openingHoursSpecification' in ld) && !('sameAs' in ld), 'no hours or profiles until confirmed');
    assert(!('aggregateRating' in ld), 'schema must not claim ratings');
    eq(ld.address.addressLocality, 'Memphis', 'schema city');
    eq(ld.address.addressRegion, 'TN', 'schema state');
    assert(!ld.address.streetAddress, 'no street address for a mobile business');
    eq(ld.areaServed.name, 'Memphis', 'areaServed');
    const nav = await page.$$eval('#nav-links a', (a) => a.map((x) => x.textContent.trim().toUpperCase()));
    eq(nav.join('|'), 'HOME|SERVICES|OUR WORK|ABOUT|CONTACT|BOOK NOW', 'navigation');
    eq(await page.textContent('#year'), String(new Date().getFullYear()), 'copyright year');
    const noAlt = await page.$$eval('img:not([alt])', (i) => i.length);
    eq(noAlt, 0, 'images without alt');
    eq(await page.isVisible('#reviews'), false, 'reviews hidden while empty');
    eq(await page.isVisible('#footer-social'), false, 'social icons hidden while empty');
    eq(problems.length, 0, problems.join('; '));
    await ctx.close();
  });

  /* Memphis targeting */
  await test('memphis: local copy, service area section and soft ZIP check', async () => {
    const { ctx, page, problems } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    assert(/Memphis, TN/.test(await page.textContent('.hero__eyebrow')), 'hero names Memphis');
    assert(await page.locator('#service-area').count() === 1, 'service area section');
    const hoods = await page.$$eval('.area__list li', (l) => l.map((x) => x.textContent.trim()));
    assert(hoods.length >= 6 && hoods.includes('Midtown') && hoods.includes('Cordova'), `neighborhoods: ${hoods}`);
    assert(/Memphis/.test(await page.textContent('.footer__mobile')), 'footer names Memphis');
    assert(await page.locator('.footer__links a[href="#service-area"]').count() === 1, 'footer link to service area');
    const faq = await page.$$eval('.qa summary', (n) => n.map((x) => x.textContent));
    assert(faq.some((q) => /areas of Memphis/.test(q)), 'service-area FAQ');
    assert(/Memphis/.test(await page.textContent('#area-title')), 'service area heading names Memphis');
    await fillStep1(page, 'Exterior Wash', 'Car');
    await page.click('[data-next]');
    await page.fill('#f-location', '123 Main St, Memphis, TN 38103');
    assert(!(await page.isVisible('#h-location')), 'Memphis ZIP: no hint');
    await page.fill('#f-location', '72201');
    assert(await page.isVisible('#h-location'), 'non-Memphis ZIP shows the hint');
    assert(/outside the Memphis area/.test(await page.textContent('#h-location')), 'hint text');
    await page.fill('#f-location', '10450 Poplar Ave, Memphis 38117');
    assert(!(await page.isVisible('#h-location')), 'house number is not mistaken for a ZIP');
    await page.fill('#f-location', '38016');
    assert(!(await page.isVisible('#h-location')), 'Cordova 38016 counts as Memphis area');
    await page.fill('#f-location', '38024');
    assert(await page.isVisible('#h-location'), 'Dyersburg 38024 shows the hint');
    await page.fill('#f-location', 'Cordova');
    assert(!(await page.isVisible('#h-location')), 'no ZIP: no hint');
    eq(problems.length, 0, problems.join('; '));
    await ctx.close();
  });

  /* SEO: headings, metadata, content, images, CTAs */
  await test('seo: metadata, heading hierarchy, service content, images and calls to action', async () => {
    const { ctx, page, problems } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    eq(await page.getAttribute('meta[name="robots"]', 'content'), 'index, follow, max-image-preview:large', 'robots meta');
    assert(/^https:\/\//.test(await page.getAttribute('link[rel="canonical"]', 'href')), 'canonical is absolute https');
    eq(await page.getAttribute('meta[property="og:title"]', 'content'), await page.title(), 'og:title matches title');
    eq(await page.getAttribute('html', 'lang'), 'en', 'lang');
    const h1 = (await page.textContent('h1')).replace(/\s+/g, ' ').trim();
    eq(h1, 'Professional Auto Detailing in Memphis, TN | Legendary Detailing', 'h1 text');
    const h2s = await page.$$eval('main h2', (n) => n.filter((x) => !x.closest('[hidden]')).map((x) => x.textContent.trim()));
    for (const want of ['Professional Interior & Exterior Detailing', 'Our Auto Detailing Services', 'See Our Detailing Work', 'Why Choose Legendary Detailing?', 'Request Your Detailing Appointment']) {
      assert(h2s.includes(want), `missing H2 "${want}" in ${JSON.stringify(h2s)}`);
    }
    const skips = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => !h.closest('[hidden], template'));
      const out = []; let prev = 0;
      hs.forEach((h) => { const lvl = Number(h.tagName[1]); if (prev && lvl > prev + 1) out.push(`${h.tagName} "${h.textContent.trim()}" after h${prev}`); prev = lvl; });
      if (hs[0].tagName !== 'H1') out.push('first heading is not h1');
      return out;
    });
    eq(skips.length, 0, `heading level skips: ${skips.join('; ')}`);
    const words = await page.$$eval('.guide__item', (n) => n.map((a) => [a.querySelector('h3').textContent, [...a.querySelectorAll('p')].map((p) => p.textContent).join(' ').split(/\s+/).filter(Boolean).length]));
    eq(words.length, 4, 'four service guides');
    words.forEach(([h, w]) => assert(w >= 80 && w <= 150, `"${h}" has ${w} words (want 80-150)`));
    const alts = await page.$$eval('main img, header img, footer img', (n) => n.map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), deco: !!i.closest('[aria-hidden="true"]') })));
    alts.forEach((i) => assert(i.alt !== null && (i.deco || i.alt.length >= 10 || i.alt === 'Legendary Detailing'), `weak alt on ${i.src}: "${i.alt}"`));
    const decoBg = await page.getAttribute('.book__bg img', 'alt');
    eq(decoBg, '', 'decorative background image has empty alt');
    const ctas = await page.$$eval('a.btn, a.guide__link', (n) => n.map((a) => a.textContent.replace(/\s+/g, ' ').trim()));
    for (const c of ['Book Your Detail', 'Request a Quote', 'Call Legendary Detailing', 'View Our Work']) assert(ctas.includes(c), `CTA "${c}" missing`);
    const html = await page.content();
    assert(!/noindex/i.test(html), 'no noindex on the homepage');
    assert(!/aggregateRating|reviewRating|streetAddress/.test(html), 'no fabricated ratings or street address in structured data');
    eq(problems.length, 0, problems.join('; '));
    await ctx.close();
  });

  await test('analytics: phone, text, email, book clicks and form results raise tracking events', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__events = [];
      document.addEventListener('ld:track', (e) => window.__events.push(e.detail.name + '|' + (e.detail.props.location || e.detail.props.package || '')));
      window.addEventListener('click', (e) => { const a = e.target.closest('a[href^="tel:"], a[href^="sms:"], a[href^="mailto:"]'); if (a) e.preventDefault(); }, true);
    });
    await page.route('https://plausible.io/**', (r) => r.fulfill({ contentType: 'text/javascript', body: '/* stub */' }));
    await page.route('**/assets/js/content.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.LD_SOCIAL={};window.LD_REVIEWS=[];window.LD_HOURS=[];window.LD_ANALYTICS={provider:"plausible",siteId:"example.com"};' }));
    await page.route('https://formsubmit.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":"true"}' }));
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    eq(await page.locator('script[src="https://plausible.io/js/script.js"][data-domain="example.com"]').count(), 1, 'plausible loaded with domain');
    await page.locator('.hero__links a[href^="tel:"]').click();
    await page.locator('.hero__links a[href^="sms:"]').click();
    await page.locator('#contact a[href^="mailto:"]').first().click();
    await page.locator('.hero__actions a[href="#book"]').click();
    await fillStep1(page, 'Full Detail', 'Car');
    await page.click('[data-next]');
    await page.fill('#f-name', 'Test Customer'); await page.fill('#f-phone', '9015550100');
    await page.click('#form-submit');
    await page.waitForSelector('#form-success', { state: 'visible' });
    const events = await page.evaluate(() => window.__events);
    for (const want of ['Phone click|home', 'Text click|home', 'Email click|contact', 'Book button click|home', 'Booking request sent|Full Detail']) {
      assert(events.includes(want), `missing event ${want} in ${JSON.stringify(events)}`);
    }
    const queued = await page.evaluate(() => (window.plausible.q || []).map((a) => a[0]));
    assert(queued.includes('Phone click') && queued.includes('Booking request sent'), `plausible queue: ${queued}`);
    await ctx.close();
  });

  /* 3. Price estimator */
  await test('booking: price estimate follows the flyer pricing', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    eq((await estimate(page)).trim(), 'Choose a package', 'initial estimate');
    await fillStep1(page, 'Full Detail', 'Car');
    eq(await estimate(page), '$80', 'Full Detail car');
    await page.locator('input[name="Vehicle Type"][value="SUV / Truck"]').check({ force: true });
    eq(await estimate(page), '$100', 'Full Detail SUV');
    await page.locator('input[name="Add-ons"][value="Handwash"]').check({ force: true });
    eq(await estimate(page), '$125', 'Full Detail SUV + handwash');
    await page.locator('input[name="Add-ons"][value="Buffing"]').check({ force: true });
    eq(await estimate(page), '$145', '+ buffing');
    await page.locator('input[name="Package"][value="Full Detail Package"]').check({ force: true });
    eq(await estimate(page), '$165', 'Full Detail Package SUV + handwash (buffing included)');
    for (const v of ['Buffing', 'UV Protection', 'Rain Repellent']) {
      assert(await page.locator(`input[name="Add-ons"][value="${v}"]`).isDisabled(), `${v} should be included/disabled`);
    }
    await page.locator('input[name="Add-ons"][value="Handwash"]').uncheck({ force: true });
    await page.locator('input[name="Package"][value="Exterior Wash"]').check({ force: true });
    eq(await estimate(page), '$20', 'Exterior SUV (no posted surcharge)');
    assert(/confirmed when we reach out/i.test(await page.textContent('#estimate-note')), 'SUV note for exterior');
    await page.locator('input[name="Package"][value="Custom Detailing"]').check({ force: true });
    eq(await estimate(page), 'Custom quote', 'custom');
    await ctx.close();
  });

  /* 4. Validation and step flow */
  await test('booking: two-step validation, back button and package pre-select', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    await page.click('[data-next]');
    assert(await page.isVisible('#e-package') && await page.isVisible('#e-vehicle'), 'step 1 errors should show');
    assert(await page.isVisible('#step-1') && !(await page.isVisible('#step-2')), 'should stay on step 1');
    await fillStep1(page);
    assert(!(await page.isVisible('#e-package')), 'error clears after choosing');
    await page.click('[data-next]');
    await page.waitForSelector('#step-2', { state: 'visible' });
    assert(/Full Detail/.test(await page.textContent('#form-summary')) && /\$100/.test(await page.textContent('#form-summary')), 'summary on step 2');
    await page.click('#form-submit');
    assert(await page.isVisible('#e-name') && await page.isVisible('#e-phone'), 'name/phone errors');
    assert(!(await page.isVisible('#e-email')), 'email is optional');
    await page.fill('#f-name', 'Test Customer');
    await page.fill('#f-phone', '555-123');
    await page.fill('#f-email', 'not-an-email');
    await page.click('#form-submit');
    assert(await page.isVisible('#e-phone') && await page.isVisible('#e-email'), 'bad phone/email errors');
    await page.click('[data-back]');
    await page.waitForSelector('#step-1', { state: 'visible' });
    assert(await page.locator('input[name="Package"][value="Full Detail"]').isChecked(), 'selection kept after Back');
    // services "Book" buttons pre-select the package
    await page.click('[data-package="Full Detail Package"]');
    assert(await page.locator('input[name="Package"][value="Full Detail Package"]').isChecked(), 'Book button pre-selects');
    await page.waitForFunction(() => { const t = document.getElementById('book').getBoundingClientRect().top; return Math.abs(t) < 120; }, null, { timeout: 4000 }).catch(() => {});
    const top = await page.evaluate(() => document.getElementById('book').getBoundingClientRect().top);
    assert(Math.abs(top) < 120, `Book button should scroll to the form (top=${top})`);
    const dateMin = await page.getAttribute('#f-date', 'min');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(dateMin), 'date min set to today');
    await ctx.close();
  });

  /* 5. Submission success and failure */
  await test('booking: successful submission sends the right data and confirms', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    let payload = null;
    await page.route('https://formsubmit.co/**', async (route) => {
      payload = JSON.parse(route.request().postData());
      eq(route.request().url(), `https://formsubmit.co/ajax/${EMAIL}`, 'ajax endpoint');
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":"true","message":"The form was submitted successfully."}' });
    });
    await fillStep1(page, 'Full Detail Package', 'SUV / Truck', ['Handwash']);
    await page.fill('#f-vehicle', '2021 Porsche Macan');
    await page.click('[data-next]');
    await page.fill('#f-name', 'Test Customer');
    await page.fill('#f-phone', '(901) 555-0100');
    await page.fill('#f-email', 'test@example.com');
    await page.fill('#f-location', '38103');
    await page.selectOption('#f-time', 'Morning');
    await page.fill('#f-details', 'Pet hair in the back seat.');
    await page.click('#form-submit');
    await page.waitForSelector('#form-success', { state: 'visible' });
    const msg = await page.textContent('#form-success p');
    eq(msg.trim(), "Thank you for contacting Legendary Detailing! We've received your request and will be in touch to discuss your appointment.", 'confirmation text');
    assert(payload, 'no payload sent');
    eq(payload.Package, 'Full Detail Package', 'Package');
    eq(payload['Vehicle Type'], 'SUV / Truck', 'Vehicle Type');
    eq(payload['Add-ons'], 'Handwash', 'Add-ons');
    eq(payload['Estimated Starting Price'], '$165 (estimate)', 'estimate field');
    eq(payload['Full Name'], 'Test Customer', 'name');
    eq(payload._replyto, 'test@example.com', 'reply-to');
    eq(payload['Service Location'], '38103', 'location');
    eq(payload._subject, 'New detail request from the Legendary Detailing website', 'subject');
    assert(!payload._honey, 'honeypot empty');
    assert(!(await page.isVisible('#booking-form')), 'form hidden after success');
    await ctx.close();
  });

  await test('booking: failed submission shows call/text/email fallback', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.route('https://formsubmit.co/**', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":"false","message":"This form needs Activation."}' }));
    await fillStep1(page, 'Interior Detail', 'Car');
    await page.click('[data-next]');
    await page.fill('#f-name', 'Test Customer');
    await page.fill('#f-phone', '9015550100');
    await page.click('#form-submit');
    await page.waitForSelector('#form-error', { state: 'visible' });
    assert(await page.locator(`#form-error a[href="${PHONE_TEL}"]`).count() === 1, 'call link in error');
    const mail = await page.getAttribute('#form-error a[href^="mailto:"]', 'href');
    assert(mail.includes(EMAIL) && decodeURIComponent(mail).includes('Interior Detail'), 'mailto fallback carries the request');
    assert(await page.isVisible('#booking-form'), 'form stays for retry');
    await ctx.close();
  });

  /* 6. Gallery viewer */
  await test('gallery: full-screen viewer opens, navigates with keys, closes and restores focus', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    const btn = page.locator('#gallery .tile__btn').nth(1);
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForSelector('#lightbox:not([hidden])');
    assert(/Audi R8 V10/.test(await page.textContent('#lightbox-cap')), 'caption for 2nd photo');
    await page.waitForFunction(() => document.getElementById('lightbox-img').naturalWidth > 0);
    await page.keyboard.press('ArrowRight');
    assert(/Porsche Macan/.test(await page.textContent('#lightbox-cap')), 'next photo');
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
    assert(/Porsche Macan wheel/.test(await page.textContent('#lightbox-cap')), 'wraps around backwards');
    await axe(page, 'lightbox open');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#lightbox', { state: 'hidden' });
    eq(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'View full-size photo: Audi R8 V10', 'focus returns to the photo');
    await ctx.close();
  });

  /* 7. Mobile menu, quick bar, FAQ */
  await test('mobile: menu opens/closes, quick bar appears after the hero and hides at the form', async () => {
    const { ctx, page } = await openPage(browser, base, { ...devices['iPhone 13'] });
    assert(!(await page.isVisible('#nav-links a[href="#services"]')), 'menu closed at start');
    await page.click('#nav-toggle');
    await page.waitForTimeout(700);
    assert(await page.isVisible('#nav-links a[href="#services"]'), 'menu open');
    eq(await page.getAttribute('#nav-toggle', 'aria-expanded'), 'true', 'aria-expanded');
    await page.click('#nav-links a[href="#services"]');
    await page.waitForTimeout(900);
    eq(await page.getAttribute('#nav-toggle', 'aria-expanded'), 'false', 'menu closes after choosing a link');
    const servicesTop = await page.evaluate(() => document.getElementById('services').getBoundingClientRect().top);
    assert(servicesTop < 120 && servicesTop > -40, `menu link scrolls to section (top=${servicesTop})`);
    await page.click('#nav-toggle'); await page.keyboard.press('Escape');
    eq(await page.getAttribute('#nav-toggle', 'aria-expanded'), 'false', 'Escape closes menu');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(700);
    const vh = await page.evaluate(() => window.innerHeight);
    const qbTop = await page.evaluate(() => document.querySelector('.quickbar').getBoundingClientRect().top);
    assert(qbTop >= vh, 'quick bar hidden on the hero');
    await page.evaluate(() => window.scrollTo({ top: document.getElementById('services').offsetTop, behavior: 'instant' })); await page.waitForTimeout(700);
    const qb2 = await page.evaluate(() => document.querySelector('.quickbar').getBoundingClientRect().top);
    assert(qb2 < vh, 'quick bar visible mid-page');
    await page.evaluate(() => window.scrollTo({ top: document.getElementById('book').offsetTop + 200, behavior: 'instant' })); await page.waitForTimeout(800);
    const qb3 = await page.evaluate(() => document.querySelector('.quickbar').getBoundingClientRect().top);
    assert(qb3 >= vh, 'quick bar gets out of the way of the form');
    const sizes = await page.$$eval('.quickbar a', (a) => a.map((x) => x.getBoundingClientRect().height));
    assert(sizes.every((h) => h >= 44), 'quick bar targets ≥44px');
    await ctx.close();
  });

  await test('faq: accordion opens and closes', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    const q = page.locator('.qa', { has: page.locator('summary', { hasText: 'How much does a detail cost?' }) });
    await q.locator('summary').scrollIntoViewIfNeeded();
    await q.locator('summary').click(); await page.waitForTimeout(600);
    assert(await q.evaluate((d) => d.open), 'opens');
    assert(/\$120/.test(await q.locator('.qa__body').innerText()), 'pricing answer');
    await q.locator('summary').click(); await page.waitForTimeout(600);
    assert(!(await q.evaluate((d) => d.open)), 'closes');
    await ctx.close();
  });

  /* 8. Reviews and social come from content.js */
  await test('content.js: real reviews and social links render; editor preview works', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } }, '?editor');
    assert(await page.isVisible('#reviews'), 'editor preview shows reviews section');
    eq(await page.locator('.review--placeholder').count(), 3, 'placeholder cards in editor');
    await ctx.close();
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p2 = await ctx2.newPage();
    await p2.route('**/assets/js/content.js', (r) => r.fulfill({ contentType: 'text/javascript', body: `window.LD_SOCIAL={instagram:"https://instagram.com/example",facebook:"",tiktok:"",google:"https://g.page/r/example"};window.LD_HOURS=[{label:"Mon - Fri",days:["Monday","Tuesday","Wednesday","Thursday","Friday"],opens:"08:00",closes:"18:30"},{days:["Funday"],opens:"x",closes:"y"}];window.LD_REVIEWS=[{name:"A. Customer",vehicle:"2020 Audi",rating:5,text:"Great work.",source:"Google"}];` }));
    await p2.goto(base + '/', { waitUntil: 'networkidle' });
    assert(await p2.isVisible('#reviews'), 'reviews visible with real data');
    eq(await p2.locator('.review').count(), 1, 'one review');
    eq(await p2.getAttribute('.review__stars', 'aria-label'), '5 out of 5 stars', 'stars label');
    eq(await p2.locator('#footer-social a').count(), 2, 'instagram + google icons');
    assert(await p2.isVisible('#reviews-more a'), 'read-all-reviews link');
    assert(await p2.isVisible('#footer-hours'), 'hours shown');
    eq(await p2.locator('#hours-list li').count(), 1, 'invalid hours entry ignored');
    eq((await p2.textContent('#hours-list li')).replace(/\s+/g, ' ').trim(), 'Mon - Fri8 AM - 6:30 PM', 'hours formatting');
    const biz = JSON.parse(await p2.$eval('#ld-json', (s) => s.textContent))['@graph'].find((n) => n['@type'] === 'AutomotiveBusiness');
    eq(JSON.stringify(biz.sameAs), JSON.stringify(['https://instagram.com/example', 'https://g.page/r/example']), 'sameAs from content.js');
    eq(biz.openingHoursSpecification[0].closes, '18:30', 'hours in structured data');
    await ctx2.close();
  });

  /* 9. Accessibility */
  await test('accessibility: no axe-core violations on desktop, mobile and form step 2', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await scrollThrough(page);
    await axe(page, 'desktop');
    await fillStep1(page);
    await page.click('[data-next]');
    await page.click('#form-submit'); // show errors too
    await axe(page, 'form step 2 with errors');
    await ctx.close();
    const m = await openPage(browser, base, { ...devices['iPhone 13'], reducedMotion: 'reduce' });
    await axe(m.page, 'mobile');
    await m.page.click('#nav-toggle'); await m.page.waitForTimeout(300);
    await axe(m.page, 'mobile menu open');
    await m.ctx.close();
  });

  await test('accessibility: keyboard can reach and operate the booking form', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    await page.focus('input[name="Package"][value="Exterior Wash"]');
    await page.keyboard.press('ArrowRight'); // radios move with arrows
    assert(await page.locator('input[name="Package"][value="Interior Detail"]').isChecked(), 'arrow key selects next package');
    await page.focus('input[name="Vehicle Type"][value="Car"]');
    await page.keyboard.press('Space');
    await page.focus('#f-vehicle');
    await page.keyboard.press('Enter'); // Enter on step 1 advances
    await page.waitForSelector('#step-2', { state: 'visible' });
    await page.waitForTimeout(500);
    eq(await page.evaluate(() => document.activeElement.id), 'f-name', 'focus moves to first field of step 2');
    await ctx.close();
  });

  /* 10. Fallbacks */
  await test('fallback: everything is visible and usable with JavaScript turned off', async () => {
    const { ctx, page } = await openPage(browser, base, { viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const hidden = await page.evaluate(() => [...document.querySelectorAll('.reveal, .load-in, .hero__title .gloss')].filter((el) => getComputedStyle(el).opacity !== '1').length);
    eq(hidden, 0, 'elements stuck invisible');
    assert(await page.isVisible('#step-1') && await page.isVisible('#step-2'), 'both form steps visible');
    assert(await page.isVisible('#form-submit'), 'submit visible');
    assert(!(await page.isVisible('[data-next]')), 'Continue button hidden without JS');
    const required = await page.$$eval('#booking-form [required]', (n) => n.map((x) => x.name));
    assert(['Package', 'Vehicle Type', 'Full Name', 'Phone'].every((r) => required.includes(r)), `native required fields: ${required}`);
    await ctx.close();
  });

  await test('fallback: reduced-motion users get a static, fully visible page', async () => {
    const { ctx, page, problems } = await openPage(browser, base, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await page.waitForTimeout(150);
    const hidden = await page.evaluate(() => [...document.querySelectorAll('.reveal, .load-in')].filter((el) => getComputedStyle(el).opacity !== '1').length);
    eq(hidden, 0, 'hidden elements');
    const marquee = await page.$eval('.band__track', (el) => getComputedStyle(el).animationName);
    eq(marquee, 'none', 'marquee stopped');
    eq(problems.length, 0, problems.join('; '));
    await ctx.close();
  });

  await test('security: page works under the Content-Security-Policy from _headers', async () => {
    assert(CSP, 'CSP missing from _headers');
    process.env.WITH_CSP = '1';
    const { ctx, page, problems } = await openPage(browser, base, { viewport: { width: 1440, height: 900 } });
    await page.waitForTimeout(1500);
    assert(await page.evaluate(() => document.documentElement.classList.contains('is-loaded')), 'scripts ran under CSP');
    eq(problems.length, 0, `CSP problems: ${problems.join('; ')}`);
    delete process.env.WITH_CSP;
    await ctx.close();
  });

  await test('404 page renders with the brand and a way home', async () => {
    const ctx = await browser.newContext(); const page = await ctx.newPage();
    const res = await page.goto(base + '/no-such-page');
    eq(res.status(), 404, 'status');
    assert(/wrong turn/i.test(await page.textContent('h1')), '404 headline');
    assert(await page.locator('a.btn').count() === 1, 'home button');
    await ctx.close();
  });

  await browser.close();
  server.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed\n`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
