/* =========================================================
   مشراف | Mishraf — interactions
   ========================================================= */
(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

  /* ---------- Sticky header state ---------- */
  function onScroll() {
    header.classList.toggle('is-stuck', window.scrollY > 20);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  function closeMenu() {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'فتح القائمة');
  }

  navToggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      navToggle.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (!nav.classList.contains('is-open')) return;
    if (!nav.contains(e.target) && !navToggle.contains(e.target)) closeMenu();
  });

  /* ---------- Active link on scroll (scroll spy) ---------- */
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealables.forEach(function (el) { revealer.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  var WHATSAPP_NUMBER = '966553366943';

  function showError(input, message) {
    var field = input.closest('.field');
    var slot = field.querySelector('.error');
    field.classList.toggle('has-error', Boolean(message));
    slot.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  /* `form.name` resolves to the form's own name attribute, so read fields
     through `elements` to always get the input. */
  function field(fieldName) {
    return form.elements.namedItem(fieldName);
  }

  function validate() {
    var ok = true;
    var name = field('name');
    var email = field('email');
    var message = field('message');

    if (!name.value.trim()) { showError(name, 'من فضلك اكتب اسمك'); ok = false; }
    else showError(name, '');

    if (!email.value.trim()) { showError(email, 'من فضلك اكتب بريدك الإلكتروني'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      showError(email, 'البريد الإلكتروني غير صحيح'); ok = false;
    } else showError(email, '');

    if (message.value.trim().length < 10) {
      showError(message, 'اكتب رسالة من ١٠ أحرف على الأقل'); ok = false;
    } else showError(message, '');

    return ok;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      if (!validate()) {
        status.className = 'form-status err';
        status.textContent = 'الرجاء تصحيح الحقول المحددة.';
        return;
      }

      /* No backend on a static page — the message is handed off to WhatsApp. */
      var text =
        'السلام عليكم، أنا ' + field('name').value.trim() + '\n' +
        'البريد: ' + field('email').value.trim() + '\n\n' +
        field('message').value.trim();

      window.open(
        'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text),
        '_blank',
        'noopener'
      );

      status.className = 'form-status ok';
      status.textContent = 'تم تجهيز رسالتك… أكمل الإرسال عبر الواتساب. شكرًا لتواصلك!';
      form.reset();
    });

    form.addEventListener('input', function (e) {
      if (e.target.closest('.field.has-error')) validate();
    });
  }
})();
