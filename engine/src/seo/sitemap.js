/** sitemap.xml + robots.txt generation for a single site. */

import { config } from '../../config/generation.config.js';
import { esc } from '../util/html.js';

/**
 * @param {import('../data/model.js').Business} business
 * @param {string[]} paths  clean URL paths (e.g. '/', '/about/')
 */
export function sitemapXml(business, paths) {
  const base = `${config.seo.scheme}://${business.domain}`;
  const urls = paths.map((p) => {
    const loc = base + (p.startsWith('/') ? p : `/${p}`);
    return `  <url><loc>${esc(loc)}</loc></url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(business) {
  const base = `${config.seo.scheme}://${business.domain}`;
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
}

export default { sitemapXml, robotsTxt };
