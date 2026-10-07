/**
 * Page-type registry. The generator only emits a page type when its `enabled`
 * predicate passes for a given business - this is how we avoid thin/doorway
 * pages when the underlying data isn't there.
 */

export const PAGE_TYPES = {
  home: {
    id: 'home',
    url: () => '/',
    enabled: () => true,
  },
  about: {
    id: 'about',
    url: () => '/about/',
    enabled: () => true, // safe: about page uses only business identity + city facts
  },
  services: {
    id: 'services',
    url: () => '/services/',
    enabled: (b) => b.services.length > 0,
  },
  service: {
    id: 'service',
    url: (svc) => `/services/${svc.id}/`,
    // one page per offered service
    enabled: (b) => b.services.length > 0,
  },
  serviceAreas: {
    id: 'service-areas',
    url: () => '/service-areas/',
    // Only when we actually have named areas (from rich content). We never
    // fabricate a service-area list just to spin up pages.
    enabled: (b, ctx) => ctx.areas && ctx.areas.length > 0,
  },
  area: {
    id: 'area',
    url: (area) => `/service-areas/${area.slug}/`,
    enabled: (b, ctx) => ctx.areas && ctx.areas.length > 0,
  },
  contact: {
    id: 'contact',
    url: () => '/contact/',
    enabled: () => true,
  },
  faq: {
    id: 'faq',
    url: () => '/faq/',
    enabled: (b, ctx) => ctx.faq && ctx.faq.length >= 3,
  },
};

export default PAGE_TYPES;
