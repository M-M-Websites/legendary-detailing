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

  /* ---------- Page-load sequence (hero) ---------- */
  const heroImg = $('.hero__media img');
  const markLoaded = () => root.classList.add('is-loaded');
  // Start right away: the headline never waits on the photo download (keeps first paint fast)
  if (reduceMotion || !heroImg) markLoaded();
  else requestAnimationFrame(() => requestAnimationFrame(markLoaded));

  /* ---------- Scroll-linked UI: nav, progress bar, quick bar, hero parallax ---------- */
  const nav = $('#nav');
  const bar = $('#progress-bar');
  const quickbar = $('.quickbar');
  const hero = $('#home');
  const heroMedia = $('#hero-media');
  const bookSection = $('#book');
  const parallaxOK = !reduceMotion && window.matchMedia('(min-width: 721px)').matches;
  let bookVisible = false;
  let menuOpen = false;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 40);
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    if (quickbar) quickbar.classList.toggle('is-visible', y > hero.offsetHeight * 0.55 && !bookVisible && !menuOpen);
    if (parallaxOK && heroMedia && y < hero.offsetHeight) heroMedia.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
  if (bookSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { bookVisible = e.isIntersecting; onScroll(); }, { threshold: 0.12 }).observe(bookSection);
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $('#nav-toggle');
  const links = $('#nav-links');
  const setMenu = (open) => {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    onScroll();
  };
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', links).forEach((a) => a.addEventListener('click', () => { if (menuOpen) setMenu(false); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); } });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (m) => { if (m.matches && menuOpen) setMenu(false); });

  /* ---------- Active section in nav ---------- */
  const navLinks = $$('.nav__links a:not(.btn)');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'about', 'services', 'work', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- Scroll reveals ---------- */
  const revealEls = $$('.reveal, .wipe');
  // stagger siblings inside groups so they arrive as a sequence
  $$('.menu, .why__list, .steps, .gallery, .faq__list, .pillars').forEach((group) => {
    $$('.reveal, .wipe', group).forEach((el, i) => { el.style.transitionDelay = `${Math.min(i * 0.07, 0.42)}s`; });
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
        // after the entrance, drop the delay so hovers respond instantly
        setTimeout(() => { en.target.style.transitionDelay = ''; }, 1800);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
    const steps = $('#steps');
    if (steps) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { steps.classList.add('is-visible'); o.disconnect(); } }, { threshold: 0.35 }).observe(steps);
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    const steps = $('#steps'); if (steps) steps.classList.add('is-visible');
  }

  /* ---------- FAQ: animated accordion ---------- */
  $$('.qa').forEach((qa) => {
    const summary = $('summary', qa);
    const body = $('.qa__body', qa);
    let busy = false;
    summary.addEventListener('click', (e) => {
      if (reduceMotion || !body.animate) return; // native toggle
      e.preventDefault();
      if (busy) return;
      busy = true;
      const opts = { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' };
      if (!qa.open) {
        qa.open = true;
        const h = body.scrollHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], opts).onfinish = () => { busy = false; };
      } else {
        const h = body.scrollHeight;
        body.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { ...opts, duration: 320 }).onfinish = () => { qa.open = false; busy = false; };
      }
    });
  });

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
    setTimeout(() => { lb.hidden = true; lbImg.classList.remove('is-ready'); }, reduceMotion ? 0 : 380);
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

  /* ---------- Social links (from content.js) ---------- */
  const social = window.LD_SOCIAL || {};
  const socialWrap = $('#footer-social');
  const socialNames = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', google: 'Google reviews' };
  Object.entries(socialNames).forEach(([key, label]) => {
    const url = (social[key] || '').trim();
    if (!/^https:\/\//.test(url)) return;
    const a = document.createElement('a');
    a.className = 'social'; a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', `Legendary Detailing on ${label}`);
    a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${key}"/></svg>`;
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
      const time = document.createElement('span'); time.textContent = `${fmtTime(h.opens)} - ${fmtTime(h.closes)}`;
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
      more.innerHTML = `<a href="${social.google}" target="_blank" rel="noopener">Read all reviews on Google</a>`;
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
  const estimateInput = $('#f-estimate');
  const summaryBox = $('#form-summary');
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
    if (!pkg) return { text: 'Choose a package', amount: null, note: 'Your final price is confirmed before your appointment.' };
    if (!pkg.dataset.price) return { text: 'Custom quote', amount: null, note: 'We\'ll put together a personalized quote for your vehicle.' };
    let total = Number(pkg.dataset.price);
    const isSuv = vehicle && vehicle.value === 'SUV / Truck';
    const suvFee = Number(pkg.dataset.suv || 0);
    if (isSuv) total += suvFee;
    addonInputs.forEach((a) => { if (a.checked && !a.disabled) total += Number(a.dataset.price); });
    let note = 'Based on posted starting prices. Your final price is confirmed before your appointment.';
    if (isSuv && !suvFee) note = 'SUV and truck pricing for this package is confirmed when we reach out.';
    return { text: `$${total}`, amount: total, note };
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
  const updateEstimate = () => {
    syncChoiceClasses();
    const est = calcEstimate();
    estimateValue.textContent = est.text;
    estimateValue.classList.toggle('is-muted', est.amount === null);
    estimateNote.textContent = est.note;
    estimateInput.value = est.amount !== null ? `${est.text} (estimate)` : est.text;
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
      s.classList.remove('is-entering', 'from-left');
      if (active && !reduceMotion) { void s.offsetWidth; s.classList.add('is-entering'); if (back) s.classList.add('from-left'); }
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
      setTimeout(() => target.focus({ preventScroll: true }), reduceMotion ? 0 : 350);
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
    if (problems.length && focusFirst) problems[0].focus();
    return problems.length === 0;
  };

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

  ['#f-name', '#f-phone', '#f-email'].forEach((sel) => $(sel).addEventListener('input', (e) => {
    if (e.target.closest('.field').classList.contains('is-invalid')) validateStep(2, false);
  }));
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
    submitBtn.classList.add('is-loading');
    submitBtn.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || `HTTP ${res.status}`);
      track('Booking request sent', { package: data.Package || '', vehicle: data['Vehicle Type'] || '' });
      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      success.focus({ preventScroll: true });
    } catch (err) {
      track('Booking request failed', { reason: String(err.message || '').slice(0, 60) });
      errorBox.innerHTML = `Your request didn't go through. Call or text <a href="${BUSINESS.tel}">${BUSINESS.phone}</a>, or <a href="${mailtoFallback(data)}">email your request</a> instead.`;
      errorBox.hidden = false;
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.removeAttribute('aria-busy');
    }
  });
})();
