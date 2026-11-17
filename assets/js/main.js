/* Legendary Detailing: interactions and motion */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BUSINESS = { email: 'xavierwade38@gmail.com', phone: '(901) 483-8862', tel: 'tel:+19014838862', sms: 'sms:+19014838862' };

  /* ---------- Year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Privacy-friendly analytics + conversion events ---------- */
  // Every event is also dispatched as a DOM event ("ld:track") so any tool can listen.
  const analytics = window.LD_ANALYTICS || {};
  const siteId = String(analytics.siteId || '').trim().toLowerCase();
  const provider = /^[a-z0-9.-]+$/.test(siteId) ? String(analytics.provider || '').trim().toLowerCase() : '';
  if (provider === 'plausible') {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    const sc = document.createElement('script');
    sc.defer = true; sc.src = 'https://plausible.io/js/script.js'; sc.dataset.domain = siteId;
    document.head.appendChild(sc);
  } else if (provider === 'goatcounter') {
    const sc = document.createElement('script');
    sc.async = true; sc.src = 'https://gc.zgo.at/count.js'; sc.dataset.goatcounter = `https://${siteId}.goatcounter.com/count`;
    document.head.appendChild(sc);
  }
  const track = (name, props = {}) => {
    document.dispatchEvent(new CustomEvent('ld:track', { detail: { name, props } }));
    try {
      if (provider === 'plausible' && window.plausible) window.plausible(name, { props });
      else if (provider === 'goatcounter' && window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: `event-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, title: name, event: true });
      }
    } catch (e) { /* analytics must never break the page */ }
  };
  window.ldTrack = track;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    const scope = a.closest('section[id], header[id], footer[id], nav[id], .quickbar');
    const where = scope ? (scope.id || 'quickbar') : 'page';
    if (href.startsWith('tel:')) track('Phone click', { location: where });
    else if (href.startsWith('sms:')) track('Text click', { location: where });
    else if (href.startsWith('mailto:') && !a.closest('#form-error')) track('Email click', { location: where });
    else if (href === '#book') track('Book button click', { location: where, label: a.textContent.trim().slice(0, 40) });
  });

  /* ---------- Page ready (the hero entrance itself is pure CSS, so it never waits on this file) ---------- */
  requestAnimationFrame(() => root.classList.add('is-loaded'));

  /* ---------- Header state and the phone quick bar ---------- */
  const nav = $('#nav');
  const quickbar = $('.quickbar');
  const hero = $('#home');
  const bookSection = $('#book');
  let bookVisible = false;
  let menuOpen = false;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 8);
    if (quickbar) quickbar.classList.toggle('is-visible', y > hero.offsetHeight * 0.55 && !bookVisible && !menuOpen);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
  if (bookSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { bookVisible = e.isIntersecting; onScroll(); }, { threshold: 0.12 }).observe(bookSection);
  }

  /* ---------- Mobile menu: focus moves in, the page behind is inert, Esc and links close it ---------- */
  const toggle = $('#nav-toggle');
  const links = $('#nav-links');
  const behind = [$('#main'), $('#contact'), quickbar].filter(Boolean);
  const setMenu = (open, { restoreFocus = false } = {}) => {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    behind.forEach((el) => { el.inert = open; });
    if (open) requestAnimationFrame(() => { const first = $('a', links); if (first) first.focus({ preventScroll: true }); });
    else if (restoreFocus) toggle.focus();
    onScroll();
  };
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', links).forEach((a) => a.addEventListener('click', () => { if (menuOpen) setMenu(false); }));
  document.addEventListener('keydown', (e) => {
    if (!menuOpen) return;
    if (e.key === 'Escape') setMenu(false, { restoreFocus: true });
    else if (e.key === 'Tab') {
      // keep focus inside the header (menu links + toggle) while the menu is open
      const f = [...$$('a, button', nav)].filter((el) => el.offsetParent !== null);
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (m) => { if (m.matches && menuOpen) setMenu(false); });

  /* ---------- Current section in the nav (aria-current + a drawn bar) ---------- */
  const navLinks = $$('.nav__links a:not(.btn)');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'about', 'services', 'work', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- Moment 1: the About statement lights up word by word (scrubbed, runs back on the way up) ---------- */
  const statement = $('[data-moment="word-highlight"]');
  if (statement && !reduceMotion) {
    const wrapWords = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) wrapWords(child);
      });
    };
    wrapWords(statement);
    const words = $$('.w', statement);
    statement.classList.add('is-armed');
    let lit = -1;
    const scrub = () => {
      const r = statement.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85; const end = vh * 0.45;
      const t = Math.min(1, Math.max(0, (start - r.top) / Math.max(1, (start - end) + r.height)));
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const k = atEnd ? words.length : Math.round(t * words.length);
      if (k === lit) return;
      lit = k;
      words.forEach((w, i) => w.classList.toggle('is-on', i < k));
    };
    let raf = 0;
    const onScrub = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; scrub(); }); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { window.addEventListener('scroll', onScrub, { passive: true }); scrub(); }
        else { window.removeEventListener('scroll', onScrub); scrub(); }
      }, { rootMargin: '20% 0px' }).observe(statement);
    } else { words.forEach((w) => w.classList.add('is-on')); }
  }

  /* ---------- Moment 2: the Process section holds still while its three steps take turns ---------- */
  const chapters = $('#steps');
  if (chapters) {
    const stepEls = $$('.step', chapters);
    const shots = $$('.chapters__frame img', chapters);
    const stepsList = $('.steps', chapters);
    const rail = document.createElement('span');
    rail.className = 'steps__rail'; rail.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'steps__fill'; rail.appendChild(fill);
    const wide = window.matchMedia('(min-width: 960px)');
    let active = 0;
    const setActive = (n) => {
      if (n === active) return;
      shots.forEach((img, i) => { img.classList.toggle('was-active', i === active); img.classList.toggle('is-active', i === n); });
      stepEls.forEach((s, i) => s.classList.toggle('is-active', i === n));
      active = n;
      setTimeout(() => shots.forEach((img, i) => { if (i !== active) img.classList.remove('was-active'); }), 520);
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = chapters.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      fill.style.transform = `scaleY(${p.toFixed(4)})`;
      setActive(Math.min(stepEls.length - 1, Math.floor(p * stepEls.length * 0.999)));
    };
    const onScrollPin = () => { if (!raf) raf = requestAnimationFrame(update); };
    const arm = () => {
      const on = wide.matches && !reduceMotion;
      chapters.classList.toggle('is-pinned', on);
      if (on) {
        if (!rail.isConnected) stepsList.prepend(rail);
        window.addEventListener('scroll', onScrollPin, { passive: true });
        update();
      } else {
        rail.remove();
        window.removeEventListener('scroll', onScrollPin);
        stepEls.forEach((s, i) => s.classList.toggle('is-active', i === 0));
        shots.forEach((img, i) => { img.classList.toggle('is-active', i === 0); img.classList.remove('was-active'); });
        active = 0;
      }
    };
    wide.addEventListener('change', arm);
    arm();
  }

  /* ---------- Services: the photo frame follows the package you point at or focus ---------- */
  const frameShots = $$('#config-frame img');
  const pkgs = $$('.config__menu .pkg');
  const showShot = (pkg) => {
    pkgs.forEach((p) => p.classList.toggle('is-active', p === pkg));
    frameShots.forEach((img) => img.classList.toggle('is-active', img.dataset.shot === pkg.dataset.shot));
  };
  if (frameShots.length) {
    pkgs.forEach((pkg) => {
      pkg.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showShot(pkg); });
      pkg.addEventListener('focusin', () => showShot(pkg));
    });
  }

  /* ---------- FAQ: the open answer is in the address, so it can be shared and survives a refresh ---------- */
  const qas = $$('.qa');
  qas.forEach((qa) => {
    const body = $('.qa__body', qa);
    qa.addEventListener('toggle', () => {
      if (qa.open) {
        if (!reduceMotion) { body.classList.remove('is-entering'); void body.offsetWidth; body.classList.add('is-entering'); }
        if (qa.id && history.replaceState) history.replaceState(null, '', '#' + qa.id);
      } else if (qa.id && location.hash === '#' + qa.id && history.replaceState) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    });
  });
  const openFromHash = () => {
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('qa')) { target.open = true; target.scrollIntoView({ block: 'start' }); }
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ---------- Gallery lightbox ---------- */
  const tiles = $$('#gallery .tile');
  const lb = $('#lightbox');
  const lbImg = $('#lightbox-img');
  const lbCap = $('#lightbox-cap');
  let idx = 0;
  let lastFocus = null;
  const showPhoto = (i) => {
    idx = (i + tiles.length) % tiles.length;
    const t = tiles[idx];
    const img = $('img', t);
    lbImg.classList.remove('is-ready');
    lbImg.onload = () => lbImg.classList.add('is-ready');
    lbImg.src = t.dataset.full || img.currentSrc || img.src;
    lbImg.alt = img.alt;
    if (lbImg.complete && lbImg.naturalWidth) requestAnimationFrame(() => lbImg.classList.add('is-ready'));
    const cap = $('figcaption', t);
    lbCap.textContent = `${cap ? cap.textContent.trim() : ''}  (${idx + 1} of ${tiles.length})`;
  };
  const openLightbox = (i) => {
    lastFocus = document.activeElement;
    showPhoto(i);
    lb.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('is-open')));
    document.body.style.overflow = 'hidden';
    $('.lightbox__close', lb).focus();
  };
  const closeLightbox = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; lbImg.classList.remove('is-ready'); }, reduceMotion ? 0 : 200);
    if (lastFocus) lastFocus.focus();
  };
  tiles.forEach((t, i) => $('.tile__btn', t).addEventListener('click', () => openLightbox(i)));
  $('.lightbox__close', lb).addEventListener('click', closeLightbox);
  $('.lightbox__nav--prev', lb).addEventListener('click', () => showPhoto(idx - 1));
  $('.lightbox__nav--next', lb).addEventListener('click', () => showPhoto(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') showPhoto(idx - 1);
    else if (e.key === 'ArrowRight') showPhoto(idx + 1);
    else if (e.key === 'Tab') {
      const f = $$('button', lb); const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showPhoto(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Copy the email address ---------- */
  $$('[data-copy]').forEach((btn) => {
    const label = $('.copy__label', btn);
    const status = document.getElementById(btn.getAttribute('aria-describedby'));
    let timer = 0;
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
      }
      clearTimeout(timer);
      btn.classList.toggle('is-copied', ok);
      label.textContent = ok ? 'Copied' : 'Press Ctrl+C to copy';
      if (status) status.textContent = ok ? 'Email address copied' : '';
      timer = setTimeout(() => { btn.classList.remove('is-copied'); label.textContent = 'Copy email'; if (status) status.textContent = ''; }, 2000);
    });
  });

  /* ---------- Social links (from content.js) ---------- */
  const social = window.LD_SOCIAL || {};
  const socialWrap = $('#footer-social');
  const socialNames = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', google: 'Google reviews' };
  Object.entries(socialNames).forEach(([key, label]) => {
    const url = (social[key] || '').trim();
    if (!/^https:\/\//.test(url)) return;
    const a = document.createElement('a');
    a.className = 'social'; a.href = url;
    a.setAttribute('aria-label', `Legendary Detailing on ${label}`);
    a.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${key}"/></svg>`;
    socialWrap.appendChild(a);
    socialWrap.hidden = false;
  });

  /* ---------- Business hours (from content.js) ---------- */
  const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = (Array.isArray(window.LD_HOURS) ? window.LD_HOURS : []).filter((h) => h && Array.isArray(h.days) && h.days.length
    && h.days.every((d) => DAY_ORDER.includes(d)) && /^\d{2}:\d{2}$/.test(h.opens || '') && /^\d{2}:\d{2}$/.test(h.closes || ''));
  const fmtTime = (t) => { const [hh, mm] = t.split(':').map(Number); const ap = hh >= 12 ? 'PM' : 'AM'; return `${((hh + 11) % 12) + 1}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${ap}`; };
  if (hours.length) {
    const list = $('#hours-list');
    hours.forEach((h) => {
      const li = document.createElement('li');
      const day = document.createElement('span'); day.textContent = h.label || h.days.join(', ');
      const time = document.createElement('span'); time.textContent = `${fmtTime(h.opens)} – ${fmtTime(h.closes)}`;
      li.append(day, time); list.appendChild(li);
    });
    $('#footer-hours').hidden = false;
  }

  /* ---------- Structured data: add confirmed social profiles and hours from content.js ---------- */
  const ldScript = $('#ld-json');
  if (ldScript) {
    try {
      const ld = JSON.parse(ldScript.textContent);
      const biz = (ld['@graph'] || []).find((n) => n['@type'] === 'AutomotiveBusiness');
      const profiles = Object.keys(socialNames).map((k) => (social[k] || '').trim()).filter((u) => /^https:\/\//.test(u));
      if (biz && (profiles.length || hours.length)) {
        if (profiles.length) biz.sameAs = profiles;
        if (hours.length) biz.openingHoursSpecification = hours.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes }));
        ldScript.textContent = JSON.stringify(ld);
      }
    } catch (e) { /* leave the static structured data untouched */ }
  }

  /* ---------- Reviews (from content.js): shown only when real reviews exist ---------- */
  const reviews = (Array.isArray(window.LD_REVIEWS) ? window.LD_REVIEWS : []).filter((r) => r && r.text && r.name);
  const editorMode = new URLSearchParams(location.search).has('editor');
  const reviewsSection = $('#reviews');
  const grid = $('#reviews-grid');
  const tpl = $('#review-tpl');
  const renderReview = (r, placeholder = false) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    if (placeholder) node.classList.add('review--placeholder');
    const stars = Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0)));
    const starsEl = $('.review__stars', node);
    if (stars) { starsEl.textContent = '★'.repeat(stars); starsEl.setAttribute('role', 'img'); starsEl.setAttribute('aria-label', `${stars} out of 5 stars`); }
    $('.review__text', node).textContent = r.text;
    $('.review__name', node).textContent = r.name;
    $('.review__meta', node).textContent = [r.vehicle, r.source ? `via ${r.source}` : ''].filter(Boolean).join(', ');
    grid.appendChild(node);
  };
  if (reviews.length) {
    reviews.forEach((r) => renderReview(r));
    reviewsSection.hidden = false;
    if (/^https:\/\//.test(social.google || '')) {
      const more = $('#reviews-more');
      const a = document.createElement('a');
      a.href = social.google; a.textContent = 'Read all reviews on Google';
      more.appendChild(a);
      more.hidden = false;
    }
  } else if (editorMode) {
    const note = document.createElement('p');
    note.className = 'editor-note';
    note.textContent = 'Editor preview: these placeholder cards only appear with ?editor in the address. Add real reviews in assets/js/content.js to publish this section.';
    grid.appendChild(note);
    for (let i = 0; i < 3; i++) renderReview({ name: 'Customer name', vehicle: 'Vehicle', rating: 5, text: 'A real customer review appears here once it is added to content.js.' }, true);
    reviewsSection.hidden = false;
  }

  /* ---------- Image placeholders: a soft shimmer in each photo's own colour until it has loaded ---------- */
  $$('.frame, .tile__btn').forEach((w) => {
    const img = $('img', w);
    if (!img || (img.complete && img.naturalWidth)) return;
    w.classList.add('is-loading');
    const done = () => w.classList.remove('is-loading');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  /* ---------- Booking form ---------- */
  const form = $('#booking-form');
  if (!form) return;
  form.noValidate = true; // JS handles validation; without JS the browser's native checks apply
  const steps = $$('.form__step', form);
  const dots = $$('[data-step-dot]', form);
  const success = $('#form-success');
  const errorBox = $('#form-error');
  const submitBtn = $('#form-submit');
  const estimateValue = $('#estimate-value');
  const estimateNote = $('#estimate-note');
  const estimateLines = $('#estimate-lines');
  const estimateInput = $('#f-estimate');
  const summaryBox = $('#form-summary');
  const statusEl = $('#form-status');
  const dateInput = $('#f-date');
  if (dateInput) {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    dateInput.min = d.toISOString().slice(0, 10);
  }

  const pkgInputs = $$('input[name="Package"]', form);
  const vehicleInputs = $$('input[name="Vehicle Type"]', form);
  const addonInputs = $$('input[name="Add-ons"]', form);
  const checked = (list) => list.find((i) => i.checked) || null;

  // keep a class on choices for browsers without :has()
  const syncChoiceClasses = () => $$('.choice', form).forEach((c) => c.classList.toggle('is-checked', $('input', c).checked));

  const calcEstimate = () => {
    const pkg = checked(pkgInputs);
    const vehicle = checked(vehicleInputs);
    const included = pkg && pkg.dataset.includes ? pkg.dataset.includes.split(',') : [];
    addonInputs.forEach((a) => {
      const inc = included.includes(a.value);
      a.disabled = inc;
      if (inc) a.checked = false;
      const price = $('.choice__price', a.closest('.choice'));
      price.textContent = inc ? 'Included' : (a.value === 'Handwash' ? '+$25' : `$${a.dataset.price}`);
    });
    const lines = [];
    if (!pkg) return { text: 'Choose a package', amount: null, lines, note: 'Your final price is confirmed before your appointment.' };
    if (!pkg.dataset.price) return { text: 'Custom quote', amount: null, lines, note: 'We\'ll put together a personalized quote for your vehicle.' };
    let total = Number(pkg.dataset.price);
    lines.push([pkg.value, `$${pkg.dataset.price}`]);
    const isSuv = vehicle && vehicle.value === 'SUV / Truck';
    const suvFee = Number(pkg.dataset.suv || 0);
    if (isSuv && suvFee) { total += suvFee; lines.push(['SUV / truck', `+$${suvFee}`]); }
    addonInputs.forEach((a) => {
      if (a.checked && !a.disabled) { total += Number(a.dataset.price); lines.push([$('.choice__name', a.closest('.choice')).textContent, `+$${a.dataset.price}`]); }
    });
    included.forEach((name) => lines.push([name.replace('UV Protection', 'UV protection').replace('Rain Repellent', 'Rain repellent'), 'Included']));
    let note = 'Based on posted starting prices. Your final price is confirmed before your appointment.';
    if (isSuv && !suvFee) note = 'SUV and truck pricing for this package is confirmed when we reach out.';
    return { text: `$${total}`, amount: total, lines, note };
  };

  const describe = () => {
    const pkg = checked(pkgInputs);
    const vehicle = checked(vehicleInputs);
    const adds = addonInputs.filter((a) => a.checked).map((a) => a.value);
    const est = calcEstimate();
    if (!pkg) return '';
    const parts = [`<strong>${pkg.value}</strong>`];
    if (vehicle) parts.push({ 'Car': 'for a car', 'SUV / Truck': 'for an SUV or truck', 'Other / Not sure': 'for your vehicle' }[vehicle.value] || '');
    if (adds.length) parts.push(`with ${adds.join(', ').toLowerCase()}`);
    return `${parts.join(' ')}. ${est.amount !== null ? `Estimated starting price: <strong>${est.text}</strong>.` : est.text + '.'}`;
  };

  let lastEstimate = '';
  let lastLines = '';
  const updateEstimate = () => {
    syncChoiceClasses();
    const est = calcEstimate();
    estimateValue.textContent = est.text;
    estimateValue.classList.toggle('is-muted', est.amount === null);
    estimateNote.textContent = est.note;
    estimateInput.value = est.amount !== null ? `${est.text} (estimate)` : est.text;
    // work-order lines: only redraw when they change, new lines settle in one after another
    const key = JSON.stringify(est.lines);
    if (key !== lastLines) {
      const before = new Set(JSON.parse(lastLines || '[]').map((l) => l[0]));
      estimateLines.textContent = '';
      let n = 0;
      est.lines.forEach(([name, price]) => {
        const li = document.createElement('li');
        const a = document.createElement('span'); a.textContent = name;
        const b = document.createElement('span'); b.textContent = price;
        li.append(a, b);
        if (before.has(name) || reduceMotion) li.style.animation = 'none';
        else li.style.setProperty('--i', String(n++));
        estimateLines.appendChild(li);
      });
      lastLines = key;
    }
    if (est.text !== lastEstimate && lastEstimate && !reduceMotion) {
      estimateValue.classList.remove('is-bump'); void estimateValue.offsetWidth; estimateValue.classList.add('is-bump');
    }
    lastEstimate = est.text;
    summaryBox.innerHTML = describe();
  };
  form.addEventListener('change', (e) => {
    if (e.target.matches('input[type="radio"], input[type="checkbox"]')) {
      const c = e.target.closest('.choice');
      if (c && !reduceMotion) { c.classList.remove('is-pop'); void c.offsetWidth; c.classList.add('is-pop'); }
      const field = e.target.closest('.field');
      if (field && field.classList.contains('is-invalid')) validateStep(1, false);
      updateEstimate();
    }
  });
  updateEstimate();

  /* steps */
  let current = 1;
  const goTo = (n, focus = true) => {
    if (n === current) return;
    const back = n < current;
    steps.forEach((s) => {
      const active = Number(s.dataset.step) === n;
      s.classList.toggle('is-active', active);
      s.classList.remove('step-enter', 'from-left');
      if (active && !reduceMotion) { void s.offsetWidth; s.classList.add('step-enter'); if (back) s.classList.add('from-left'); }
    });
    dots.forEach((d) => {
      const k = Number(d.dataset.stepDot);
      d.classList.toggle('is-active', k === n);
      d.classList.toggle('is-done', k < n);
    });
    current = n;
    const card = $('.book__card');
    const top = card.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (focus) {
      const target = n === 1 ? $('input[name="Package"]:checked', form) || pkgInputs[0] : $('#f-name');
      setTimeout(() => target.focus({ preventScroll: true }), reduceMotion ? 0 : 300);
    }
  };

  const setFieldError = (field, errEl, bad) => {
    field.classList.toggle('is-invalid', bad);
    errEl.hidden = !bad;
    const input = $('input:not([type="radio"]):not([type="checkbox"])', field);
    if (input) input.setAttribute('aria-invalid', String(bad));
  };

  const validateStep = (n, focusFirst = true) => {
    const problems = [];
    if (n === 1) {
      const pkgField = $('[data-required="package"]', form).closest('.field');
      const vehField = $('[data-required="vehicle"]', form).closest('.field');
      const pkgBad = !checked(pkgInputs);
      const vehBad = !checked(vehicleInputs);
      setFieldError(pkgField, $('#e-package'), pkgBad);
      setFieldError(vehField, $('#e-vehicle'), vehBad);
      if (pkgBad) problems.push(pkgInputs[0]);
      if (vehBad) problems.push(vehicleInputs[0]);
    } else {
      const name = $('#f-name'); const phone = $('#f-phone'); const email = $('#f-email');
      const nameBad = name.value.trim().length < 2;
      const digits = phone.value.replace(/\D/g, '');
      const phoneBad = !(digits.length === 10 || (digits.length === 11 && digits.startsWith('1')));
      const emailBad = email.value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      setFieldError(name.closest('.field'), $('#e-name'), nameBad);
      setFieldError(phone.closest('.field'), $('#e-phone'), phoneBad);
      setFieldError(email.closest('.field'), $('#e-email'), emailBad);
      if (nameBad) problems.push(name);
      if (phoneBad) problems.push(phone);
      if (emailBad) problems.push(email);
    }
    if (problems.length && focusFirst) {
      problems[0].focus();
      if (!reduceMotion) problems.forEach((el) => { const f = el.closest('.field'); f.classList.remove('is-shake'); void f.offsetWidth; f.classList.add('is-shake'); });
    }
    return problems.length === 0;
  };
  form.addEventListener('animationend', (e) => { if (e.target.classList.contains('is-shake')) e.target.classList.remove('is-shake'); });

  $('[data-next]', form).addEventListener('click', () => { if (validateStep(1)) goTo(2); });
  $('[data-back]', form).addEventListener('click', () => goTo(1));
  /* Soft Memphis-area hint: never blocks the request */
  const loc = $('#f-location');
  const locHint = $('#h-location');
  if (loc && locHint) {
    // Memphis (381xx) plus Shelby County ZIPs outside the 381 prefix (Cordova, Arlington, Bartlett, Collierville, Millington...)
    const MEMPHIS_AREA = /^(381\d\d|380(02|16|17|18|27|28|53|54|55|83|88))$/;
    const checkZip = () => {
      // the ZIP is the last 5-digit number, so house numbers like "10450 Poplar Ave" are ignored
      const nums = loc.value.match(/\b\d{5}(?=(-\d{4})?\b)/g) || [];
      const zip = nums.length ? nums[nums.length - 1] : '';
      const outside = Boolean(zip) && !MEMPHIS_AREA.test(zip);
      locHint.textContent = outside ? 'That ZIP looks outside the Memphis area. Send your request anyway and we\'ll let you know if we can reach you.' : '';
      locHint.hidden = !outside;
    };
    loc.addEventListener('input', checkZip);
  }

  // Check a field when the user leaves it (once they've typed something), then re-check live while it shows an error
  const fieldRules = {
    'f-name': [(v) => v.trim().length >= 2, 'e-name'],
    'f-phone': [(v) => { const d = v.replace(/\D/g, ''); return d.length === 10 || (d.length === 11 && d.startsWith('1')); }, 'e-phone'],
    'f-email': [(v) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), 'e-email'],
  };
  Object.entries(fieldRules).forEach(([id, [ok, errId]]) => {
    const input = document.getElementById(id);
    const check = () => setFieldError(input.closest('.field'), document.getElementById(errId), !ok(input.value));
    input.addEventListener('blur', () => { if (input.value.trim() !== '' || input.closest('.field').classList.contains('is-invalid')) check(); });
    input.addEventListener('input', () => { if (input.closest('.field').classList.contains('is-invalid')) check(); });
  });
  // Enter key on step 1 moves forward instead of submitting
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && current === 1 && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'button') {
      e.preventDefault();
      if (validateStep(1)) goTo(2);
    }
  });

  /* "Book" buttons in the services section pre-select the package */
  $$('[data-package]').forEach((btn) => btn.addEventListener('click', () => {
    const input = pkgInputs.find((i) => i.value === btn.dataset.package);
    if (input) { input.checked = true; updateEstimate(); }
    if (current !== 1) goTo(1, false);
  }));

  const mailtoFallback = (data) => {
    const body = Object.entries(data).filter(([k, v]) => !k.startsWith('_') && v).map(([k, v]) => `${k}: ${v}`).join('\n');
    return `mailto:${BUSINESS.email}?subject=${encodeURIComponent('Detail request')}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    errorBox.hidden = true;
    if (!validateStep(1, false)) { goTo(1); validateStep(1); return; }
    if (!validateStep(2)) return;
    const fd = new FormData(form);
    if (fd.get('_honey')) return; // bot
    const data = {};
    for (const [k, v] of fd.entries()) {
      if (k === 'Add-ons') continue;
      data[k] = typeof v === 'string' ? v.trim() : v;
    }
    data['Add-ons'] = fd.getAll('Add-ons').join(', ') || 'None';
    if (data.email) data._replyto = data.email;
    submitBtn.style.minWidth = `${submitBtn.offsetWidth}px`; // the button keeps its width while sending
    submitBtn.classList.add('is-loading');
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.disabled = true;
    $('.btn__label', submitBtn).textContent = 'Sending…';
    statusEl.textContent = 'Sending your request…';
    const slowTimer = setTimeout(() => { statusEl.textContent = 'Still sending, one moment…'; }, 4000);
    try {
      const res = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || `HTTP ${res.status}`);
      track('Booking request sent', { package: data.Package || '', vehicle: data['Vehicle Type'] || '' });
      const first = (data['Full Name'] || '').split(/\s+/)[0];
      $('#success-title').textContent = first ? `Thanks, ${first}. Request received.` : 'Request received.';
      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      success.focus({ preventScroll: true });
    } catch (err) {
      track('Booking request failed', { reason: String(err.message || '').slice(0, 60) });
      errorBox.innerHTML = `Your request didn’t go through, and everything you entered is still here. Try again, call or text <a href="${BUSINESS.tel}">${BUSINESS.phone}</a>, or <a href="${mailtoFallback(data)}">email your request</a> instead.<br><button type="button" class="btn btn--secondary form__retry">Try sending again</button>`;
      errorBox.hidden = false;
      $('.form__retry', errorBox).addEventListener('click', () => (form.requestSubmit ? form.requestSubmit() : submitBtn.click()));
    } finally {
      clearTimeout(slowTimer);
      statusEl.textContent = '';
      submitBtn.classList.remove('is-loading');
      submitBtn.removeAttribute('aria-busy');
      submitBtn.disabled = false;
      submitBtn.style.minWidth = '';
      $('.btn__label', submitBtn).textContent = 'Request My Detail';
    }
  });
})();
