/**
 * Browser-side responsive sweep, served by serve-all.mjs at /__sweep.js on
 * EVERY site's port (never written into a site's own output).
 *
 * Static QA (broken images / duplicate images / dead links / alt text) is
 * decidable from the built files and lives in scripts/qa-sites.mjs. Layout is
 * not - it needs a real layout engine - so this runs in the browser, loading
 * every page of the current site into a hidden same-origin iframe at each
 * device width and measuring:
 *
 *   overflow  - documentElement.scrollWidth > clientWidth, i.e. the page
 *               scrolls sideways. Reports the offending elements by class.
 *   tap       - a .btn/.btn-call under 44px tall at phone width (the engine's
 *               own standing rule: "never under 44px tall").
 *   tiny      - body text under 11.5px inside <main>.
 *
 * RESUMABLE ON PURPOSE. The browser tool kills a script at 30s and the
 * biggest sites are ~100 pages x 4 widths = ~400 iframe loads, so each call
 * works a ~20s slice, parks its state on window.__sweep, and returns
 * `done:false`. Call run() again until `done:true`.
 *
 *   const m = await import('/__sweep.js'); await m.run();
 */

// 320 is the standard responsive floor (iPhone SE), 1920 the common large
// desktop. The phone-only checks (tap size, minimum font size) run at the
// NARROWEST width, where they are hardest to pass.
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const PHONE_W = WIDTHS[0];

/**
 * One iframe PER WIDTH, all advancing concurrently.
 *
 * A single iframe stepping through width x url sequentially is fine when the
 * page is visible, but the Browser pane is often HIDDEN, and a hidden page has
 * its iframe loads deprioritised hard - throughput dropped to ~9 pages per 6s
 * call, which would need ~18 calls for one 28-page site. Six iframes in
 * flight overlap that latency instead of paying it serially, and each one
 * keeps a FIXED width for its whole life so no iframe ever reflows between
 * loads. Progress is the sum across lanes, so a resumed call picks up
 * wherever each lane left off.
 */
export async function run(budgetMs = 20000) {
  let s = window.__sweep;
  if (!s || s.port !== location.port) {
    const xml = await fetch('/sitemap.xml').then((r) => r.text());
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''));
    const lanes = WIDTHS.map((width) => {
      const fr = document.createElement('iframe');
      fr.style.cssText = `position:fixed;left:-9999px;top:0;height:900px;border:0;width:${width}px`;
      document.body.appendChild(fr);
      return { width, fr, i: 0 };
    });
    s = window.__sweep = {
      port: location.port, lanes, urls, total: WIDTHS.length * urls.length,
      pages: urls.length, ov: [], tap: new Set(), tiny: new Set(),
    };
  }

  const t0 = Date.now();
  const done = () => s.lanes.every((l) => l.i >= s.urls.length);
  await Promise.all(s.lanes.map(async (lane) => {
    while (lane.i < s.urls.length && Date.now() - t0 < budgetMs) {
      const u = s.urls[lane.i++];
      const width = lane.width;
      await new Promise((res) => { lane.fr.onload = () => res(); lane.fr.src = u; });
      const d = lane.fr.contentDocument, w = lane.fr.contentWindow;
    const vw = d.documentElement.clientWidth;
    const ox = d.documentElement.scrollWidth - vw;
    if (ox > 1) {
      // Name the actual culprits - "page overflows by 40px" is not actionable,
      // ".cov-list,.brandbar__row" is.
      const n = new Set();
      d.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && r.width > 8) {
          n.add(el.tagName.toLowerCase() + (el.className ? '.' + el.className.toString().trim().split(/\s+/)[0] : ''));
        }
      });
      s.ov.push(`${width}px ${u} +${ox}px [${[...n].slice(0, 3).join(',')}]`);
    }
    if (width === PHONE_W) {
      // offsetHeight, NOT getBoundingClientRect(). The rect is the VISUAL box,
      // so it inherits any ancestor transform - and GSAP's scroll reveals park
      // un-scrolled sections at scale(0.97), which no iframe ever triggers out
      // of. That reported a genuinely 45px button as 43.51px (45 x 0.97) and
      // flagged 8 clean pages on Las Cruces. offsetHeight is the layout value
      // and is transform-independent, which is what a tap target actually is.
      if ([...d.querySelectorAll('.btn,a.btn-call')].some((b) => {
        const h = b.offsetHeight;
        return h > 0 && h < 44;
      })) s.tap.add(u);
      d.querySelectorAll('main *').forEach((el) => {
        if (el.children.length || !(el.textContent || '').trim()) return;
        const fs = parseFloat(w.getComputedStyle(el).fontSize);
        if (fs && fs < 11.5) s.tiny.add(`${u} ${fs}px`);
      });
    }
    }
  }));

  const finished = done();
  if (finished) s.lanes.forEach((l) => l.fr.remove());
  return {
    port: s.port, pages: s.pages, done: finished,
    progress: `${s.lanes.reduce((n, l) => n + l.i, 0)}/${s.total}`,
    overflow: s.ov.length, sample: s.ov.slice(0, 4),
    tapUnder44: s.tap.size, tapSample: [...s.tap].slice(0, 2),
    tinyText: s.tiny.size, tinySample: [...s.tiny].slice(0, 2),
  };
}
