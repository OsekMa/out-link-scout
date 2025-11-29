import { LinkData } from '../types';

/**
 * Normalizes a URL and checks if it is valid.
 */
export const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Helper to normalize hostnames (removes 'www.' and converts to lowercase)
 */
const normalizeHostname = (hostname: string): string => {
  return hostname.toLowerCase().replace(/^www\./, '');
};

/**
 * Extracts links from an HTML string and categorizes them as internal/external.
 * Uses a proxy response content.
 */
export const extractLinks = (html: string, baseUrl: string): LinkData[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const anchorTags = doc.querySelectorAll('a');
  const links: LinkData[] = [];
  
  // Normalize base hostname to compare effectively
  // e.g., 'www.example.com' becomes 'example.com'
  const baseHostname = normalizeHostname(new URL(baseUrl).hostname);

  anchorTags.forEach((a) => {
    const rawHref = a.getAttribute('href');
    // Use innerText but cleanup extra whitespace
    const text = (a.innerText || a.textContent || '').trim() || a.title || '[Image/No Text]';

    if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('#')) {
      return;
    }

    try {
      // Resolve relative URLs against the base URL
      const resolvedUrl = new URL(rawHref, baseUrl);
      
      const resolvedHostname = normalizeHostname(resolvedUrl.hostname);
      
      // Check if external
      // We consider it external if the normalized hostname is different.
      // e.g. 'google.com' vs 'example.com' -> External
      // e.g. 'www.example.com' vs 'example.com' -> Internal (Ignored)
      // e.g. 'blog.example.com' vs 'example.com' -> External (Usually considered outbound from root, or sub-property)
      // Based on user request "Don't grab this domain", strict hostname mismatch works best but ignoring 'www' prefix.
      const isExternal = resolvedHostname !== baseHostname;

      // Only add if we haven't seen this exact resolved URL before (deduplication)
      const exists = links.some(l => l.href === resolvedUrl.href);

      if (!exists && isExternal) {
        links.push({
          href: resolvedUrl.href,
          text: text.slice(0, 100), // Truncate long text
          hostname: resolvedUrl.hostname,
          isExternal: true,
        });
      }
    } catch (err) {
      // Invalid URL in href, skip
    }
  });

  return links;
};