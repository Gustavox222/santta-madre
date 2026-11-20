/* Santta Madre Barbearia · interações
   GSAP + ScrollTrigger + SplitText: entrada do hero, faixa que acelera com a rolagem,
   revelação da galeria, contador e barras das notas.
   Motion (motion.dev): palavra que gira, mola nos botões, botão magnético, linhas da tabela.
   Componentes no estilo 21st.dev em JS puro: spotlight card, rotating text, marquee de depoimentos. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var M = window.Motion || null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Horário: hoje + aberto agora (horário do Google Maps, fuso de São Paulo) ---------- */
  var HOURS = { 0: null, 1: [9, 21], 2: [9, 21], 3: [9, 21], 4: [9, 21], 5: [9, 21], 6: [8, 17] };
  var DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function spNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var map = {}; parts.forEach(function (p) { map[p.type] = p.value; });
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(map.weekday);
      var h = parseInt(map.hour, 10) % 24, m = parseInt(map.minute, 10);
      return { day: day, t: h + m / 60 };
    } catch (e) { var d = new Date(); return { day: d.getDay(), t: d.getHours() + d.getMinutes() / 60 }; }
  }
  function nextOpen(day, t) {
    for (var i = 0; i < 8; i++) {
      var d = (day + i) % 7, h = HOURS[d];
      if (!h) continue;
      if (i === 0 && t >= h[0]) continue;
      var when = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : DAY_NAMES[d];
      return 'abre ' + when + ' às ' + h[0] + 'h';
    }
    return '';
  }
  (function hours() {
    var now = spNow();
    var row = $('[data-hours] [data-day="' + now.day + '"]');
    if (row) row.classList.add('is-today');
    var status = $('[data-status]'), text = $('[data-status-text]');
    if (!status || !text) return;
    var h = HOURS[now.day];
    if (h && now.t >= h[0] && now.t < h[1]) {
      status.classList.add('is-open');
      text.textContent = 'Aberto agora · até ' + h[1] + 'h';
    } else {
      status.classList.add('is-closed');
      text.textContent = 'Fechado · ' + nextOpen(now.day, now.t);
    }
  })();

  /* ---------- Navegação ---------- */
  var nav = $('[data-nav]');
  function onScroll() { if (nav) nav.classList.toggle('is-solid', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var toggle = $('[data-menu-toggle]'), menu = $('[data-menu]');
  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    $('.sr', toggle).textContent = open ? 'Fechar menu' : 'Abrir menu';
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    document.documentElement.classList.toggle('menu-open', open);
    if (open && M && !reduce) M.animate($$('a', menu), { opacity: [0, 1], y: [16, 0] }, { delay: M.stagger(0.05), duration: 0.4 });
  }
  if (toggle) toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu || document.createElement('div')).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && toggle && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); } });

  /* ---------- Agendamento Booksy em janela ---------- */
  var dialog = $('[data-booking]');
  if (dialog && typeof dialog.showModal === 'function') {
    var frame = $('iframe', dialog);
    $$('[data-booksy]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        setMenu(false);
        if (!frame.src) frame.src = frame.getAttribute('data-src');
        dialog.showModal();
        if (M && !reduce) M.animate(dialog, { opacity: [0, 1], y: [24, 0], scale: [0.98, 1] }, { type: 'spring', bounce: 0.2, duration: 0.5 });
      });
    });
    $('[data-booking-close]', dialog).addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }

  /* ---------- Copiar endereço ---------- */
  $$('[data-copy]').forEach(function (b) {
    var label = b.textContent;
    b.addEventListener('click', function () {
      var done = function (t) { b.textContent = t; setTimeout(function () { b.textContent = label; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () { done('Endereço copiado'); }, function () { done('Copie manualmente'); });
      else done('Copie manualmente');
    });
  });

  var year = $('[data-year]'); if (year) year.textContent = new Date().getFullYear();

  /* ---------- Depoimentos: marquee contínuo com pausa (estilo 21st.dev) ---------- */
  var quotes = $('[data-quotes]'), track = $('[data-quotes-track]');
  if (quotes && track && !reduce) {
    $$('.quote', track).forEach(function (q) { var c = q.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    quotes.classList.add('is-ready');
    var pause = $('[data-quotes-pause]');
    pause.addEventListener('click', function () {
      var p = quotes.classList.toggle('is-paused');
      pause.setAttribute('aria-pressed', String(p));
      pause.textContent = p ? 'Continuar depoimentos' : 'Pausar depoimentos';
    });
  } else if (quotes) { var pb = $('[data-quotes-pause]'); if (pb) pb.hidden = true; }

  /* ---------- Spotlight cards (estilo 21st.dev) ---------- */
  if (finePointer) {
    $$('[data-spotlight]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  if (reduce) return; /* daqui pra baixo, só movimento */

  /* ---------- Motion: mola nos botões + botão magnético ---------- */
  if (M) {
    $$('.btn, .quotes__pause, .booking__close').forEach(function (el) {
      M.press(el, function () {
        M.animate(el, { scale: 0.95 }, { type: 'spring', stiffness: 600, damping: 30 });
        return function () { M.animate(el, { scale: 1 }, { type: 'spring', stiffness: 500, damping: 15 }); };
      });
    });
    if (finePointer) {
      $$('[data-magnetic]').forEach(function (el) {
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
          M.animate(el, { x: x, y: y }, { type: 'spring', stiffness: 300, damping: 18 });
        });
        el.addEventListener('pointerleave', function () { M.animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 260, damping: 14 }); });
      });
    }

    /* Rotating text (estilo 21st.dev) */
    var rot = $('[data-rotator] .rotator__word');
    if (rot) {
      var words = ['resenha.', 'sinuca.', 'cerveja gelada.', 'risada.'], i = 0;
      M.animate(rot, { y: ['70%', '0%'], opacity: [0, 1], rotate: [6, -3] }, { type: 'spring', stiffness: 220, damping: 14, delay: 0.8 });
      setInterval(function () {
        if (document.hidden) return;
        M.animate(rot, { y: ['0%', '55%'], opacity: [1, 0], rotate: [-3, 2] }, { duration: 0.32, ease: [0.4, 0, 1, 1] }).then(function () {
          i = (i + 1) % words.length;
          rot.textContent = words[i];
          M.animate(rot, { y: ['-45%', '0%'], opacity: [0, 1], rotate: [-9, -3] }, { type: 'spring', stiffness: 260, damping: 16 });
        });
      }, 2800);
    }

    /* Linhas da tabela de preços entram uma a uma, uma vez */
    $$('.price').forEach(function (list) {
      var rows = $$('li', list);
      rows.forEach(function (r) { r.style.opacity = '0'; });
      M.inView(list, function () {
        M.animate(rows, { opacity: [0, 1], x: [-14, 0] }, { delay: M.stagger(0.06), duration: 0.45, ease: [0.2, 0.7, 0.2, 1] });
      }, { amount: 0.2 });
    });
  }

  if (!hasGSAP) return;
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  /* ---------- Hero: entrada única ---------- */
  var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  var photo = $('[data-hero-photo]');
  if (photo) {
    tl.fromTo(photo, { clipPath: 'inset(100% 0% 0% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.3, ease: 'expo.inOut' }, 0)
      .fromTo($('img', photo), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.2);
  }
  if (window.SplitText) {
    $$('[data-split]').forEach(function (el, n) {
      var split = window.SplitText.create(el, { type: 'chars', mask: 'chars' });
      tl.from(split.chars, { yPercent: 115, duration: 0.9, stagger: 0.028 }, 0.25 + n * 0.12);
    });
  }
  tl.from('[data-hero-item]', { y: 26, opacity: 0, duration: 0.8, stagger: 0.09 }, 0.55)
    .from('.seal', { scale: 0, rotate: -120, duration: 1, ease: 'back.out(1.6)' }, 0.9)
    .from('.status', { x: -20, opacity: 0, duration: 0.6 }, 1.1);

  if (!window.ScrollTrigger) return;
  var ST = window.ScrollTrigger;

  /* ---------- Faixa: roda sozinha e acelera/inverte com a rolagem ---------- */
  var mq = $('[data-marquee]');
  if (mq) {
    var loop = gsap.to(mq, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    var dir = 1;
    ST.create({
      trigger: '.band', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        dir = self.direction;
        var v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
        gsap.to(loop, { timeScale: dir * (1 + v), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, ease: 'power2.out' });
      }
    });
  }

  /* ---------- O espaço: cada foto abre do centro conforme rola (o momento da página) ---------- */
  $$('[data-gallery] .bento__item').forEach(function (item, n) {
    gsap.fromTo(item, { clipPath: 'inset(14% 10% 14% 10% round 14px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'none',
      scrollTrigger: { trigger: item, start: 'top 95%', end: 'top 50%', scrub: 0.6 }
    });
    gsap.fromTo($('img', item), { scale: 1.22 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: item, start: 'top 95%', end: 'bottom 40%', scrub: 0.6 },
      onComplete: function () { gsap.set($('img', item), { clearProps: 'transform' }); }
    });
  });

  /* ---------- Endereço grande: entra em linhas ---------- */
  if (window.SplitText) {
    var addr = $('[data-split-lines]');
    if (addr) {
      var s = window.SplitText.create(addr, { type: 'words', mask: 'words' });
      gsap.from(s.words, { yPercent: 110, duration: 1, stagger: 0.06, ease: 'power4.out', scrollTrigger: { trigger: addr, start: 'top 85%', once: true } });
    }
  }

  /* ---------- Nota: contador + barras ---------- */
  var score = $('[data-score]');
  if (score) {
    var num = $('[data-count]', score), bars = $$('.bars i', score);
    var obj = { v: 0 };
    gsap.set(bars, { '--p': 0 });
    ST.create({
      trigger: score, start: 'top 80%', once: true,
      onEnter: function () {
        gsap.to(obj, { v: parseFloat(num.getAttribute('data-count')), duration: 1.6, ease: 'power3.out', onUpdate: function () { num.textContent = obj.v.toFixed(1).replace('.', ','); } });
        gsap.to(bars, { '--p': 1, duration: 1.4, stagger: 0.08, ease: 'power3.out' });
      }
    });
  }

  /* ---------- Curso: foto com leve deslocamento dentro da moldura ---------- */
  var cursoImg = $('#curso .split__photo img');
  if (cursoImg) {
    gsap.fromTo(cursoImg, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '#curso', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
})();
