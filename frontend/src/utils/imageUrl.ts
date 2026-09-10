/**
 * Resolves an image URL for display in standard <img> tags.
 * Returns a valid URL string or null if the image cannot be displayed safely.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // 1. Full absolute web URLs (HTTP / HTTPS)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 2. Local public assets starting with leading slash (e.g. /images/mandapam.jpg)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // 3. Storage object paths (e.g. "submissions/{uuid}.jpg")
  // The mandapam-images bucket is private. Until authenticated/signed image
  // serving is implemented, return null so the UI safely renders the festival fallback (🕉️).
  return null;
}
