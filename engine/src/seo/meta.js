/**
 * SEO meta generation: <title>, description, canonical, Open Graph, Twitter.
 * Clean URLs are produced by the generator; this module renders the <head> tags
 * for a given page.
 */

import { config } from '../../config/generation.config.js';
import { esc } from '../util/html.js';
import { truncate } from '../util/strings.js';

export function canonicalUrl(business, pathname) {
  const base = `${config.seo.scheme}://${business.domain}`;
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return base + p;
}

/**
 * @param {object} args
 * @param {import('../data/model.js').Business} args.business
 * @param {string} args.pathname
 * @param {string} args.title
 * @param {string} args.description
 * @param {string} [args.ogImage]  data URI or absolute URL
 */
export function headMeta({ business, pathname, title, description, ogImage }) {
  const url = canonicalUrl(business, pathname);
  const desc = truncate(description || '', 158);
  const t = truncate(title, 62);
  const tags = [
    `<title>${esc(t)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta name="robots" content="index,follow">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(business.name)}">`,
    `<meta property="og:title" content="${esc(t)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : '',
    `<meta name="twitter:card" content="${esc(config.seo.twitterCard)}">`,
    `<meta name="twitter:title" content="${esc(t)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : '',
  ];
  return tags.filter(Boolean).join('\n');
}

export default headMeta;
