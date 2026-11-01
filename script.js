/* Dr. Parikh’s Pristine Dental Clinic — script.js (vanilla, no dependencies) */
(function () {
  'use strict';

  var WA_NUMBER = '919909336825';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Hero entrance ---------- */
  requestAnimationFrame(function () {
    setTimeout(function () { document.documentElement.classList.add('loaded'); }, reduceMotion ? 0 : 1950);
  });

  /* ---------- Intro: tap/click or key to skip ---------- */
  var intro = $('.intro');
  if (intro) {
    var skip = function () {
      if (intro.classList.contains('skip')) return;
      intro.classList.add('skip');
      document.documentElement.classList.remove('intro-on');
      document.documentElement.classList.add('loaded');
    };
    intro.addEventListener('click', skip);
    document.addEventListener('keydown', function k() { skip(); document.removeEventListener('keydown', k); });
    setTimeout(function () { intro.style.display = 'none'; }, 3000);
  }

  /* ---------- Year ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Header + progress ---------- */
  var header = $('.site-header');
  var bar = $('.progress span');
  var fill = $('.timeline-fill');
  var timeline = $('.timeline');
  var scanFrame = $('.scan-frame');
  var ticking = false;

  function onScroll() {
    var sy = window.scrollY || window.pageYOffset;
    header.classList.toggle('scrolled', sy > 30);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? sy / max : 0) + ')';

    if (fill && timeline) {
      var r = timeline.getBoundingClientRect();
      var p = (window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.3);
      fill.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
    }
    parallax(sy);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- Parallax + mouse depth (desktop only) ---------- */
  var depthEls = $$('.hero .hero-media');
  var mx = 0, my = 0;
  var useParallax = !reduceMotion && finePointer && window.innerWidth > 1024;

  function parallax(sy) {
    if (!useParallax) return;
    if (sy > window.innerHeight * 1.2) return;
    depthEls.forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-depth')) || 0.35;
      var tx = mx * d * 18, ty = my * d * 18 + sy * d * 0.25;
      el.style.transform = 'translate3d(' + (tx * 0.5).toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
    });
  }
  if (useParallax) {
    var hero = $('.hero');
    hero.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    });
  }

  /* ---------- Hero cinematic slideshow ---------- */
  var slides = $$('.h-slide');
  var dots = $$('.hero-dots button');
  var SLIDE_MS = 6000, cur = 0, slideTimer = null;
  document.documentElement.style.setProperty('--slide-ms', SLIDE_MS + 'ms');
  function showSlide(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (sl, k) {
      sl.classList.toggle('is-active', k === cur);
      if (k === cur) { var im = $('img', sl); if (im && im.loading === 'lazy') im.loading = 'eager'; }
    });
    var cap = $('.hero-cap'); if (cap && slides[cur]) cap.textContent = slides[cur].getAttribute('data-label');
    var nx = slides[(cur + 1) % slides.length]; if (nx) { var ni = $('img', nx); if (ni) ni.loading = 'eager'; }
    dots.forEach(function (d, k) {
      d.setAttribute('aria-selected', k === cur ? 'true' : 'false');
      var bar = $('.bar i', d); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    });
  }
  function startSlides() {
    if (reduceMotion || slides.length < 2) return;
    clearInterval(slideTimer);
    slideTimer = setInterval(function () { if (!document.hidden) showSlide(cur + 1); }, SLIDE_MS);
  }
  dots.forEach(function (d) {
    d.addEventListener('click', function () { showSlide(parseInt(d.getAttribute('data-i'), 10)); startSlides(); });
  });
  setTimeout(startSlides, reduceMotion ? 0 : 2200);

  /* ---------- Scan-line height ---------- */
  function setScan() { if (scanFrame) scanFrame.style.setProperty('--scan-h', scanFrame.offsetHeight + 'px'); }
  window.addEventListener('resize', setScan); window.addEventListener('load', setScan); setScan();

  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = $('.menu-toggle');
  var nav = $('#site-nav');
  function closeMenu(focusToggle) {
    nav.classList.remove('open'); header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu');
    if (focusToggle) toggle.focus();
  }
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') === 'true';
    if (open) { closeMenu(); return; }
    nav.classList.add('open'); header.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close menu');
    var first = $('a', nav); if (first) first.focus();
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (nav.classList.contains('open')) closeMenu(); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
  });

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.nav ul a');
  var map = {};
  navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  var alias = { highlights: 'home', compare: 'aligners', journey: 'technology', experience: 'why', reviews: 'why' };
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = alias[en.target.id] || en.target.id;
        if (!map[id]) return;
        navLinks.forEach(function (l) { l.classList.remove('active'); l.removeAttribute('aria-current'); });
        map[id].classList.add('active'); map[id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { secObs.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$('.reveal, .reveal-mask');
  // stagger siblings
  $$('.highlights-grid, .why-grid, .steps, .timeline, .tech-list, .exp-list, .cmp-table').forEach(function (g) {
    $$('.reveal', g).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.08).toFixed(2) + 's'); });
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rObs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { rObs.observe(el); });

    var tObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) en.target.classList.add('is-in'); });
    }, { rootMargin: '0px 0px -30% 0px' });
    $$('.timeline li').forEach(function (li) { tObs.observe(li); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    $$('.timeline li').forEach(function (li) { li.classList.add('is-in'); });
  }

  /* ---------- Treatment filters + mobile "show all" ---------- */
  var filters = $$('.filter');
  var cards = $$('.treat');
  var grid = $('.treat-grid');
  var showAll = $('.show-all');
  var showWrap = $('.show-all-wrap');
  var MOBILE_LIMIT = 8;
  cards.forEach(function (c, i) { if (i >= MOBILE_LIMIT) c.classList.add('extra'); });
  grid.classList.add('collapsed');
  showWrap.classList.add('active');
  showAll.addEventListener('click', function () {
    grid.classList.remove('collapsed');
    showWrap.classList.remove('active');
    showAll.setAttribute('aria-expanded', 'true');
    var next = cards[MOBILE_LIMIT]; if (next) $('.treat-btn', next).focus();
  });
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      if (f !== 'all') { grid.classList.remove('collapsed'); showWrap.classList.remove('active'); }
      filters.forEach(function (b) { var on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      cards.forEach(function (c, i) {
        var show = f === 'all' || c.getAttribute('data-cat').split(' ').indexOf(f) > -1;
        c.classList.toggle('is-hidden', !show);
        c.classList.remove('pop');
        if (show && !reduceMotion) {
          void c.offsetWidth;
          c.style.animationDelay = (Math.min(i, 10) * 0.03) + 's';
          c.classList.add('pop', 'in');
        }
      });
    });
  });

  /* ---------- Treatment modal ---------- */
  var modal = $('#treat-modal');
  var lastFocus = null;
  function openTreatment(btn) {
    var li = btn.closest('.treat');
    $('.modal-title', modal).textContent = btn.getAttribute('data-name');
    $('.modal-cat', modal).textContent = btn.getAttribute('data-catname');
    $('.modal-icon use', modal).setAttribute('href', '#i-' + btn.getAttribute('data-icon'));
    $('.modal-body', modal).innerHTML = $('.treat-long', li).innerHTML;
    var mImg = $('.modal-media img', modal), cImg = $('.treat-media img', li);
    if (mImg && cImg) { mImg.src = cImg.currentSrc || cImg.src; }
    $('.modal-book', modal).setAttribute('data-treatment', btn.getAttribute('data-name'));
    lastFocus = btn;
    if (typeof modal.showModal === 'function') { modal.showModal(); }
    else { modal.setAttribute('open', ''); }
    $('.modal-close', modal).focus();
  }
  function closeModal() {
    if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open');
  }
  $$('.treat-btn').forEach(function (b) { b.addEventListener('click', function () { openTreatment(b); }); });
  $('.modal-close', modal).addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  modal.addEventListener('close', function () { if (lastFocus) lastFocus.focus(); });
  $('.modal-book', modal).addEventListener('click', function () { closeModal(); });

  // footer treatment links open the modal
  $$('[data-open]').forEach(function (a) {
    a.addEventListener('click', function () {
      var name = a.getAttribute('data-open');
      var btn = $$('.treat-btn').filter(function (b) { return b.getAttribute('data-name') === name; })[0];
      if (btn) setTimeout(function () { openTreatment(btn); }, 650);
    });
  });

  /* ---------- Pre-select treatment when booking from a section ---------- */
  var select = $('#f-treat');
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-treatment]');
    if (!t || !select) return;
    var val = t.getAttribute('data-treatment');
    var match = $$('option', select).filter(function (o) { return o.value === val; })[0];
    if (!match && val.indexOf('Clear Aligners') > -1) val = 'Clear Aligners';
    match = $$('option', select).filter(function (o) { return o.value === val; })[0];
    if (match) select.value = val;
  });

  /* ---------- Compare toggle (mobile) ---------- */
  var cmpTable = $('.cmp-table');
  $$('.cmp-toggle button').forEach(function (b, _, all) {
    b.addEventListener('click', function () {
      all.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      cmpTable.setAttribute('data-show', b.getAttribute('data-col'));
    });
  });

  /* ---------- Reviews carousel ---------- */
  var track = $('.track');
  if (track) {
    var step = function () { var s = $('.slide', track); return s ? s.getBoundingClientRect().width + 20 : 300; };
    var go = function (dir) {
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (dir > 0 && atEnd) track.scrollTo({ left: 0 }); else track.scrollBy({ left: dir * step() });
    };
    $('.c-next').addEventListener('click', function () { go(1); });
    $('.c-prev').addEventListener('click', function () { go(-1); });
    var paused = false, timer = null;
    var car = $('.carousel');
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { car.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { car.addEventListener(ev, function () { paused = false; }); });
    if (!reduceMotion) timer = setInterval(function () { if (!paused && !document.hidden) go(1); }, 5500);
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
  }

  /* ---------- Review "Read more" ---------- */
  $$('.slide.review').forEach(function (sl) {
    var p = $('.rv-text', sl), btn = $('.rv-more', sl);
    if (!p || !btn) return;
    function check() { if (!sl.classList.contains('open')) btn.hidden = p.scrollHeight <= p.clientHeight + 2; }
    check(); window.addEventListener('resize', check);
    btn.addEventListener('click', function () {
      var open = sl.classList.toggle('open');
      btn.textContent = open ? 'Show less' : 'Read more';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- FAQ accordion ---------- */
  $$('.acc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      $$('.acc-btn').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        document.getElementById(b.getAttribute('aria-controls')).classList.remove('open');
      });
      if (!open) {
        btn.setAttribute('aria-expanded', 'true');
        document.getElementById(btn.getAttribute('aria-controls')).classList.add('open');
      }
    });
  });

  /* ---------- Magnetic CTA (subtle, desktop) ---------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.12;
        var yy = (e.clientY - r.top - r.height / 2) * 0.2;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- Booking form → WhatsApp ---------- */
  var form = $('#book-form');
  if (form) {
    var dateInput = $('#f-date');
    var today = new Date();
    var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (dateInput) dateInput.min = iso;
    var status = $('.form-status', form);

    var phoneInput = $('#f-phone');
    phoneInput.addEventListener('input', function () {
      phoneInput.value = phoneInput.value.replace(/[^\d+\s-]/g, '');
    });

    function setErr(id, msg) {
      var input = document.getElementById(id);
      var field = input.closest('.field');
      var err = document.getElementById('e-' + id.replace('f-', ''));
      field.classList.toggle('invalid', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
      return !msg;
    }
    function cleanPhone(v) {
      var d = v.replace(/\D/g, '');
      if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
      if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
      return d;
    }
    function formatDate(v) {
      if (!v) return 'Flexible';
      var p = v.split('-'); return p[2] + '/' + p[1] + '/' + p[0];
    }

    ['f-name', 'f-phone', 'f-consent'].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () {
        if (el.closest('.field').classList.contains('invalid')) validate(id);
      });
    });

    function validate(only) {
      var ok = true;
      var name = $('#f-name').value.trim();
      var phone = cleanPhone(phoneInput.value);
      if (!only || only === 'f-name') ok = setErr('f-name', name.length < 2 ? 'Please enter your full name.' : '') && ok;
      if (!only || only === 'f-phone') ok = setErr('f-phone', !/^[6-9]\d{9}$/.test(phone) ? 'Please enter a valid 10-digit Indian mobile number.' : '') && ok;
      if (!only || only === 'f-consent') ok = setErr('f-consent', !$('#f-consent').checked ? 'Please tick the box so we can contact you.' : '') && ok;
      return ok;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status'; status.textContent = '';
      if (!validate()) {
        status.className = 'form-status bad';
        status.textContent = 'Please check the highlighted fields.';
        var firstBad = $('.field.invalid input', form); if (firstBad) firstBad.focus();
        return;
      }
      var name = $('#f-name').value.trim();
      var phone = cleanPhone(phoneInput.value);
      var treatment = select.value || 'Not specified';
      var msg = $('#f-msg').value.trim() || '-';

      var text =
        'Hello Dr. Parikh’s Pristine Dental Clinic,\n\n' +
        'I would like to request an appointment.\n\n' +
        'Name: ' + name + '\n' +
        'Mobile: +91 ' + phone + '\n' +
        'Preferred Date: ' + formatDate(dateInput.value) + '\n' +
        'Treatment Interest: ' + treatment + '\n' +
        'Message: ' + msg + '\n\n' +
        'Please share the available appointment timing.';

      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
      var win = window.open(url, '_blank');
      if (win) { try { win.opener = null; } catch (err) {} } else { window.location.href = url; }

      status.className = 'form-status ok';
      status.textContent = 'WhatsApp is opening with your details. Please tap Send to request your appointment.';
      form.reset();
      $$('.field', form).forEach(function (f) { f.classList.remove('invalid'); });
    });
  }
})();

