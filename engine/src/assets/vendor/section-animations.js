/**
 * Section-wise scroll animations, powered by GSAP + ScrollTrigger loaded from
 * cdnjs (NOT from this folder - Cloudflare 403s every .js served from the
 * sites' own origin, so self-hosting them does not work in production; see the
 * comment in src/generator/layout.js). This file is not copied into a built
 * site either - layout.js INLINES it into every page, which is why it must
 * never contain a literal closing script tag.
 *
 * Each RECOGNIZED section type gets a genuinely different, richer
 * entrance treatment (stagger, count-up, bounce, alternating slide); any
 * `<section>` not matched by one of those falls back to one shared "fade up"
 * baseline, so no section/variant combination is ever left un-animated (the
 * engine has ~18 section types x up to 20 structural variants each - too
 * many exact inner-markup class names to enumerate by hand with 100%
 * coverage, so the fallback is the actual coverage guarantee, not the
 * specific presets below). Respects prefers-reduced-motion (skips
 * entirely) and only plays once per element (reveal, not a repeating loop).
 */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  var handledSections = new Set();

  // Is the viewport wide enough for multi-column section layouts? Any reveal
  // that translates an element HORIZONTALLY must be gated on this: once a grid
  // collapses to one column its children are full-width, so a positive x
  // offset starts outside the container and overflows the document sideways
  // for the whole tween (measured at the time on the since-removed resCom
  // cards: 6px of real overflow from an x:+30, on every page carrying that
  // section). Negative-only offsets are safe - the
  // document does not scroll left - so trustbar/services/process keep theirs.
  var wideVP = window.matchMedia('(min-width: 768px)').matches;

  // clearProps:'all' matters: several targets (.svc, .rev, .post-card, ...)
  // have their OWN CSS :hover transition on transform - without clearing
  // GSAP's inline style once the reveal finishes, that leftover inline
  // transform/opacity permanently fights the element's normal CSS hover
  // state (measured: element gets stuck exactly at its animation start
  // values forever, hover never visually updates again).
  function reveal(targets, vars, triggerEl) {
    var trigger = triggerEl || targets;
    var sec = (trigger.closest ? trigger.closest('section') : null) || (trigger[0] && trigger[0].closest && trigger[0].closest('section'));
    if (sec) handledSections.add(sec);
    gsap.from(targets, Object.assign({
      clearProps: 'all',
      scrollTrigger: Object.assign({ trigger: trigger, once: true, start: 'top 85%' }, vars.scrollTrigger),
    }, vars));
  }

  // ---- hero: plays immediately on load, staged reveal of each piece ----
  var hero = document.querySelector('.hero');
  if (hero) {
    handledSections.add(hero);
    var badge = hero.querySelector('.hero__badge');
    var h1 = hero.querySelector('h1');
    var sub = hero.querySelector('.hero__sub');
    var cta = hero.querySelector('.hero__cta');
    var chips = hero.querySelector('.hero__chips');
    var media = hero.querySelector('.hero__media, .hero__bg');
    var tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'all' } });
    if (media) tl.from(media, { opacity: 0, scale: 1.06, duration: 1.1 }, 0);
    if (badge) tl.from(badge, { opacity: 0, y: 16, duration: 0.5 }, 0.1);
    if (h1) tl.from(h1, { opacity: 0, y: 24, duration: 0.6 }, 0.22);
    if (sub) tl.from(sub, { opacity: 0, y: 18, duration: 0.55 }, 0.36);
    if (cta) tl.from(cta.children, { opacity: 0, y: 14, duration: 0.5, stagger: 0.1 }, 0.48);
    if (chips) tl.from(chips.children, { opacity: 0, x: -10, duration: 0.4, stagger: 0.08 }, 0.6);
  }

  // ---- trustbar: quick cascade from the left, feels like a status ticker ----
  gsap.utils.toArray('.trustbar .trust-item').forEach(function (el, i) {
    reveal(el, { opacity: 0, x: -18, duration: 0.45, delay: i * 0.06, ease: 'power2.out' }, el.closest('.trustbar'));
  });

  // ---- services: card grid pops in (scale + fade); rows/zigzag slide in from the side ----
  gsap.utils.toArray('.svc-grid, .svc-bento, .cov-cardgrid').forEach(function (grid) {
    reveal(grid.children, { opacity: 0, scale: 0.92, y: 16, duration: 0.5, stagger: 0.08, ease: 'back.out(1.6)' }, grid);
  });
  gsap.utils.toArray('.svc-rows, .svc-listing .svc-rows, .svc-zzwrap').forEach(function (rows) {
    reveal(rows.children, { opacity: 0, x: -20, duration: 0.45, stagger: 0.07, ease: 'power2.out' }, rows);
  });

  // ---- why / features: slide up from below, staggered ----
  gsap.utils.toArray('.feat, .wf-cell, .feat-row').forEach(function (el) {
    reveal(el, { opacity: 0, y: 26, duration: 0.55, ease: 'power2.out' }, el.parentElement || el);
  });

  // ---- process: sequential reveal, one treatment per MARKUP SHAPE ----
  // process() renders 9 different markup shapes across its 20 variants; only
  // the first 3 were matched here, so the other 6 - including `.proc-generic`,
  // which backs 12 of the 20 variants - fell through to the generic
  // whole-section fade-up and never animated step-by-step at all. Each shape
  // now reveals in the way its own layout implies.
  gsap.utils.toArray('.steps, .hflow, .timeline').forEach(function (list) {
    reveal(list.children, { opacity: 0, x: -16, duration: 0.4, stagger: 0.14, ease: 'power1.out' }, list);
  });
  // Generic skins (framed-outline, quiet-editorial, boxed-diagonal, ...): each
  // cell settles up into place in reading order.
  gsap.utils.toArray('.proc-generic').forEach(function (list) {
    reveal(list.children, { opacity: 0, y: 22, scale: 0.97, duration: 0.5, stagger: 0.11, ease: 'power3.out' }, list);
  });
  // Vertical lists/panels: straight top-to-bottom cascade.
  gsap.utils.toArray('.proc-numlist, .proc-stacked').forEach(function (list) {
    reveal(list.children, { opacity: 0, y: 18, duration: 0.45, stagger: 0.1, ease: 'power2.out' }, list);
  });
  // ('.proc-chat' preset removed 2026-08-25 with the chat-bubbles variant.)
  // Dot track: markers pop along the rail one after another, like a progress line filling.
  gsap.utils.toArray('.proc-track__items').forEach(function (list) {
    reveal(list.children, { opacity: 0, scale: 0.78, y: 12, duration: 0.45, stagger: 0.13, ease: 'back.out(2)' }, list);
  });

  // ---- stats: numbers count up from 0 to their real value while fading in ----
  gsap.utils.toArray('.stat__n, .ss-n, .ssp-n, .st-cell b, .cov-panel__n').forEach(function (el) {
    var sec = el.closest('section');
    if (sec) handledSections.add(sec);
    var raw = el.textContent.trim();
    // Match the numeric run IN PLACE (keeping thousands-separator commas) -
    // stripping commas first and then re-searching for the bare digits inside
    // the ORIGINAL string breaks (indexOf can't find "20915" inside "20,915"),
    // which corrupted the prefix/suffix slice and produced garbled text like
    // "20,9120,91515" instead of counting 0 -> 20,915.
    var m = raw.match(/[\d,]*[0-9]/);
    if (!m) return; // non-numeric stat (e.g. a state abbreviation) - just fade, no count
    var target = parseInt(m[0].replace(/,/g, ''), 10);
    var prefix = raw.slice(0, m.index);
    var suffix = raw.slice(m.index + m[0].length);
    var obj = { val: 0 };
    gsap.fromTo(el, { opacity: 0 }, {
      opacity: 1, duration: 0.3, clearProps: 'opacity',
      scrollTrigger: { trigger: el, once: true, start: 'top 85%' },
      onStart: function () {
        gsap.to(obj, {
          val: target, duration: 1.1, ease: 'power1.out',
          onUpdate: function () { el.textContent = prefix + Math.round(obj.val).toLocaleString() + suffix; },
          onComplete: function () { el.textContent = prefix + target.toLocaleString() + suffix; },
        });
      },
    });
  });

  // ---- gallery: figures fade + scale in, staggered ----
  // A FULL-BLEED tile (wide-hero-strip / grid-4's lead tile spans 1 / -1) must
  // not scale-reveal. scale:0.94 pulls a 1180px tile ~35px in on each side and
  // ~15px top/bottom for the length of the tween, so its edges visibly detach
  // from the section while everything around it stays put - on a full-width
  // hero that reads as the image having broken out of its frame, and it is
  // what a screenshot taken mid-scroll catches. Same class of bug as the
  // x:+30 overflow noted at the top of this file: a transform that is
  // harmless on a small grid cell
  // is not harmless on an element as wide as its container. Full-bleed tiles
  // get a plain fade + rise; the smaller cells keep the scale.
  gsap.utils.toArray('.gallery').forEach(function (grid) {
    var gw = grid.getBoundingClientRect().width;
    Array.prototype.forEach.call(grid.children, function (tile, i) {
      var fullBleed = tile.getBoundingClientRect().width >= gw - 2;
      reveal(tile, fullBleed
        ? { opacity: 0, y: 18, duration: 0.5, delay: i * 0.06, ease: 'power2.out' }
        : { opacity: 0, scale: 0.94, duration: 0.5, delay: i * 0.06, ease: 'power2.out' }, grid);
    });
  });

  // ---- reviews: cards alternate in from left/right ----
  // Desktop-only alternation, for the wideVP reason at the top of this file:
  // once the
  // grid collapses to one column the cards are full-width, so the x:+24 half
  // starts outside the container and overflows the document horizontally for
  // the duration of the tween.
  document.querySelectorAll('.grid.cols-3, .rev-badges').forEach(function (grid) {
    if (!grid.querySelector('.rev, .rev-card')) return;
    Array.prototype.forEach.call(grid.children, function (el, i) {
      reveal(el, wideVP
        ? { opacity: 0, x: i % 2 ? 24 : -24, duration: 0.5, ease: 'power2.out' }
        : { opacity: 0, y: 20, duration: 0.45, ease: 'power2.out' }, grid);
    });
  });

  // ---- areas / coverage: panel scales in, list items cascade ----
  gsap.utils.toArray('.coverage, .cov-panel, .cov-compact, .cov-cards').forEach(function (el) {
    reveal(el, { opacity: 0, scale: 0.97, duration: 0.55, ease: 'power2.out' }, el);
  });
  gsap.utils.toArray('.cov-list, .cov-cloud').forEach(function (list) {
    reveal(list.children, { opacity: 0, y: 10, duration: 0.35, stagger: 0.04 }, list);
  });

  // ---- faq: accordion items fade up, staggered ----
  gsap.utils.toArray('.faq').forEach(function (list) {
    reveal(list.children, { opacity: 0, y: 16, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, list);
  });

  // ---- cta band / cta banner: pop in with a slight bounce ----
  gsap.utils.toArray('.cta-band .container, .cta-banner__inner').forEach(function (el) {
    reveal(el, { opacity: 0, scale: 0.95, duration: 0.5, ease: 'back.out(1.7)' }, el);
  });

  // The res/com preset was removed 2026-09-10 along with the section itself.
  // Nothing emits that markup any more, so the block was dead weight inlined
  // into every page (see layout.js - this file is inlined, not linked).

  // ---- about: photo settles in with a subtle scale, copy fades up ----
  gsap.utils.toArray('.about__media').forEach(function (el) {
    reveal(el, { opacity: 0, scale: 1.04, duration: 0.7, ease: 'power2.out' }, el);
  });

  // ---- brand bar: whole row fades in (the marquee scroll itself is CSS) ----
  gsap.utils.toArray('.brandbar').forEach(function (el) {
    reveal(el, { opacity: 0, duration: 0.6 }, el);
  });

  // ---- HOVER motion (process steps) ----
  // The process section had no hover response of any kind on any of its 20
  // variants. GSAP drives the MOTION here (lift + number pop); the colour /
  // border / background side of the same hover lives in css.js. That split is
  // deliberate and must be kept: GSAP writes an inline transform, which always
  // beats a stylesheet rule, so a CSS `transform` hover on these same elements
  // would be silently dead - the exact bug already documented for .svc/.rev.
  //
  // `overwrite:'auto'` matters: without it, hovering in and out faster than the
  // tween duration queues conflicting tweens and the item drifts instead of
  // returning cleanly to rest.
  var STEP_ITEMS = '.proc-g__item, .step, .hstep, .tl-step, .proc-stack__row, .proc-numlist > li, .proc-track__item';
  var STEP_NUMS = '.proc-g__n, .step__n, .hstep__n, .tl-step__n, .proc-stack__n, .proc-numlist__n, .proc-track__dot';
  gsap.utils.toArray(STEP_ITEMS).forEach(function (item) {
    var num = item.querySelector(STEP_NUMS);
    var copy = item.querySelector(':scope > div, .tl-step__c');
    // Some variants are CELLS inside a clipping frame - framed-outline is a
    // single bordered box with overflow:hidden and hairline rules BETWEEN the
    // cells. Translating a cell there does two bad things: the step number
    // slides up under the frame's own edge and is clipped away entirely
    // (confirmed by screenshot), and the shared grid rules stop lining up. So
    // detect a clipping parent and swap the motion instead of lifting: the
    // number pops harder and the copy nudges sideways, both of which stay
    // inside the cell's padding. Checked at runtime rather than by hardcoding
    // variant names, so any future clipping variant is covered automatically.
    var wrap = item.parentElement;
    var clipped = wrap ? getComputedStyle(wrap).overflow !== 'visible' : false;
    item.addEventListener('mouseenter', function () {
      if (!clipped) gsap.to(item, { y: -6, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      // transformOrigin left-center: the number sits at the start of its row,
      // so centre-origin scaling would push it back into the cell's padding.
      if (num) gsap.to(num, { scale: clipped ? 1.24 : 1.18, transformOrigin: 'left center', duration: 0.35, ease: 'back.out(3)', overwrite: 'auto' });
      if (clipped && copy) gsap.to(copy, { x: 5, duration: 0.32, ease: 'power2.out', overwrite: 'auto' });
    });
    item.addEventListener('mouseleave', function () {
      if (!clipped) gsap.to(item, { y: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      if (num) gsap.to(num, { scale: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      if (clipped && copy) gsap.to(copy, { x: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    });
  });

  // ---- product / style-comparison / insulation / quote / post-grid / anything
  //      else not explicitly matched above: one shared fade-up baseline, so
  //      NO section on ANY page is ever left completely un-animated. ----
  gsap.utils.toArray('section').forEach(function (sec) {
    if (handledSections.has(sec)) return;
    // NEVER animate a section containing the embedded quote form.
    // The embed loads asynchronously and then RESIZES ITSELF (form_embed.js
    // sets the iframe height once the form renders). That height change alters
    // document height, which makes ScrollTrigger refresh and re-apply this
    // tween's from-state - so a form the visitor could already see blanked out
    // and faded back in. Reported as "form appears, disappears, blank, then
    // shows again" (2026-08-30).
    // A third-party widget that controls its own size and paint must not sit
    // inside a scroll-reveal; there is nothing to gain and the refresh cycle
    // fights it.
    if (sec.querySelector('.ghl-embed')) return;
    var target = sec.querySelector(':scope > .container') || sec;
    reveal(target, { opacity: 0, y: 24, duration: 0.5, ease: 'power2.out' }, sec);
  });
})();
