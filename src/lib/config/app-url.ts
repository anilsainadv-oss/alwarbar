/**
 * Canonical Application Base URL Resolver
 *
 * Provides safe, validated application base URLs for Next.js metadataBase,
 * sitemap.xml, robots.txt, Schema.org JSON-LD, and OpenGraph/Twitter cards.
 *
 * Prevents Node.js runtime/build crashes (such as `TypeError: Invalid URL`)
 * when deployment environments (e.g. Hostinger, Docker, VPS) configure
 * NEXT_PUBLIC_APP_URL without an explicit protocol scheme (e.g. 'alwarbar.mangallaxmi.com').
 */

export const DEFAULT_APP_URL = 'https://alwarbar.mangallaxmi.com';

/**
 * Resolves and normalizes the application base URL.
 *
 * Rules:
 * 1. Defaults to canonical production URL 'https://alwarbar.mangallaxmi.com' if unset or blank.
 * 2. Preserves local development protocol ('http://localhost:3000' or 'http://127.0.0.1:...').
 * 3. Prepends 'http://' to bare localhost/127.0.0.1 entries if scheme was omitted.
 * 4. Prepends 'https://' to domain entries if scheme was omitted.
 * 5. Strips any trailing slashes for clean and deterministic path concatenation.
 * 6. Validates syntax with `new URL()`; falls back to DEFAULT_APP_URL if malformed.
 */
export function getAppBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (!raw) {
    return DEFAULT_APP_URL;
  }

  let formatted = raw;

  // Check if string already starts with a valid URI scheme (e.g. https://, http://)
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(formatted);
  if (!hasScheme) {
    if (formatted.startsWith('localhost') || formatted.startsWith('127.0.0.1')) {
      formatted = `http://${formatted}`;
    } else {
      formatted = `https://${formatted}`;
    }
  }

  // Remove trailing slashes
  formatted = formatted.replace(/\/+$/, '');

  try {
    const parsed = new URL(formatted);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return DEFAULT_APP_URL;
    }
    // Return origin + pathname (without trailing slash)
    const pathname = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch {
    return DEFAULT_APP_URL;
  }
}

/**
 * Returns a guaranteed valid URL instance for Next.js metadataBase.
 */
export function getMetadataBaseUrl(): URL {
  return new URL(getAppBaseUrl());
}
