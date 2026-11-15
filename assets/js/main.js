/* Legendary Detailing — interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const BUSINESS_EMAIL = 'xavierwade38@gmail.com';
  const BUSINESS_PHONE_DISPLAY = '(901) 483-8862';
  const BUSINESS_PHONE_TEL = 'tel:+19014838862';

  /* ---------- Year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Sticky nav state + mobile quick bar ---------- */
  const nav = $('#nav');
  const quickbar = $('.quickbar');
  const hero = $('#home');
  const bookSection = $('#book');
  let bookVisible = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (quickbar) quickbar.classList.toggle('is-visible', y > hero.offsetHeight * 0.6 && !bookVisible);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (bookSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { bookVisible = e.isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(bookSection);
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $('#nav-toggle');
  const links = $('#nav-links');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', links).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && links.classList.contains('is-open')) setMenu(false); });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  /* ---------- Active nav link ---------- */
  const navMap = { home: 'home', about: 'about', services: 'services', work: 'work', contact: 'contact' };
  const navLinks = $$('.nav__links a:not(.btn)');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = navMap[en.target.id];
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navMap).forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$('.reveal');
  // stagger siblings inside grids
  $$('.services__grid, .why__grid, .gallery, .steps, .about__copy, .faq__list, .hero__content').forEach((group) => {
    $$(':scope > .reveal', group).forEach((el, i) => el.style.setProperty('--d', `${Math.min(i * 0.08, 0.5)}s`));
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
    const steps = $('#steps');
    if (steps) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { steps.classList.add('is-visible'); o.disconnect(); } }, { threshold: 0.3 }).observe(steps);
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Service buttons pre-select the form ---------- */
  const serviceSelect = $('#f-service');
  $$('[data-service]').forEach((btn) => btn.addEventListener('click', () => {
    if (serviceSelect) serviceSelect.value = btn.dataset.service;
  }));

  /* ---------- Gallery lightbox ---------- */
  const tiles = $$('#gallery .tile');
  const lb = $('#lightbox');
  const lbImg = $('#lightbox-img');
  const lbCap = $('#lightbox-cap');
  let idx = 0;
  let lastFocus = null;
  const show = (i) => {
    idx = (i + tiles.length) % tiles.length;
    const t = tiles[idx];
    const img = $('img', t);
    lbImg.src = t.dataset.full || img.currentSrc || img.src;
    lbImg.alt = img.alt;
    const cap = $('figcaption', t);
    lbCap.textContent = cap ? [...cap.children].map((c) => c.textContent).join(' — ') : '';
  };
  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    $('.lightbox__close', lb).focus();
  };
  const close = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus();
  };
  tiles.forEach((t, i) => $('.tile__btn', t).addEventListener('click', () => open(i)));
  $('.lightbox__close', lb).addEventListener('click', close);
  $('.lightbox__nav--prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lightbox__nav--next', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'Tab') { // keep focus inside the viewer
      const f = $$('button', lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Reviews ---------- */
  const reviews = Array.isArray(window.LD_REVIEWS) ? window.LD_REVIEWS.filter((r) => r && r.text && r.name) : [];
  const editorMode = new URLSearchParams(location.search).has('editor');
  const grid = $('#reviews-grid');
  const empty = $('#reviews-empty');
  const tpl = $('#review-tpl');
  const renderReview = (r, placeholder = false) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    if (placeholder) node.classList.add('review--placeholder');
    const stars = Math.max(0, Math.min(5, Number(r.rating) || 0));
    $('.review__stars', node).textContent = stars ? '★'.repeat(stars) : '';
    if (stars) node.setAttribute('aria-label', `${stars} out of 5 stars`);
    $('.review__text', node).textContent = r.text;
    $('.review__name', node).textContent = r.name;
    $('.review__meta', node).textContent = [r.vehicle, r.source && `via ${r.source}`].filter(Boolean).join(' · ');
    grid.appendChild(node);
  };
  if (reviews.length) {
    reviews.forEach((r) => renderReview(r));
    grid.hidden = false;
    empty.hidden = true;
  } else if (editorMode) {
    const note = document.createElement('p');
    note.className = 'editor-note';
    note.textContent = 'Editor preview: these placeholder cards are only visible with ?editor in the URL. Add real reviews in assets/js/reviews.js to publish them.';
    grid.appendChild(note);
    for (let i = 1; i <= 3; i++) renderReview({ name: 'Customer Name', vehicle: 'Vehicle', text: 'A verified customer review will appear here once it is added to reviews.js.' }, true);
    grid.hidden = false;
  }

  /* ---------- Booking form ---------- */
  const form = $('#booking-form');
  if (!form) return;
  const success = $('#form-success');
  const errorBox = $('#form-error');
  const submitBtn = $('#form-submit');
  const dateInput = $('#f-date');
  if (dateInput) {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    dateInput.min = d.toISOString().slice(0, 10);
  }

  const validators = {
    'f-name': (v) => v.trim().length >= 2 || 'Please enter your full name.',
    'f-phone': (v) => v.replace(/\D/g, '').length >= 10 || 'Please enter a valid phone number.',
    'f-email': (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
    'f-service': (v) => !!v || 'Please choose a service.',
  };
  const validate = () => {
    const problems = [];
    Object.entries(validators).forEach(([id, fn]) => {
      const el = document.getElementById(id);
      const res = fn(el.value || '');
      const ok = res === true;
      el.closest('.field').classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      if (!ok) problems.push({ el, msg: res });
    });
    return problems;
  };
  $$('input, select', form).forEach((el) => el.addEventListener('input', () => {
    if (el.closest('.field')?.classList.contains('is-invalid')) validate();
  }));

  const showError = (html) => { errorBox.innerHTML = html; errorBox.hidden = false; };
  const mailtoFallback = (data) => {
    const body = Object.entries(data).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}: ${v}`).join('\n');
    return `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent('Detail Request')}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    const problems = validate();
    if (problems.length) {
      showError(problems.map((p) => p.msg).join(' '));
      problems[0].el.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    if (data._honey) return; // bot
    submitBtn.classList.add('is-loading');
    try {
      const res = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, _replyto: data.email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || 'Submission failed');
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (err) {
      showError(`Sorry — your request couldn't be sent right now. Please call or text <a href="${BUSINESS_PHONE_TEL}">${BUSINESS_PHONE_DISPLAY}</a>, or <a href="${mailtoFallback(data)}">send it by email</a> instead.`);
    } finally {
      submitBtn.classList.remove('is-loading');
    }
  });
})();
