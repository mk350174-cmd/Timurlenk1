/**
 * @file Asset URL helper. Commander/bot portraits are hosted on AWS S3 (the
 * user uploads them); the app references them by a stable key and prefixes the
 * configured base URL at runtime. When the base is unset (e.g. local dev with
 * no S3 yet), `assetUrl` returns null so the UI shows an initial/placeholder
 * instead of a broken image.
 *
 * Set `VITE_ASSET_BASE_URL` in `.env.local`, e.g.
 *   VITE_ASSET_BASE_URL=https://<bucket>.s3.<region>.amazonaws.com/timurlenk
 * Then a key like `commanders/fatih.webp` resolves to
 *   https://<bucket>.s3.<region>.amazonaws.com/timurlenk/commanders/fatih.webp
 */

const BASE = (import.meta.env ?? {}).VITE_ASSET_BASE_URL?.trim().replace(/\/+$/, '') ?? '';

/** True when an S3/CDN base URL is configured. */
export const hasAssetBase = Boolean(BASE);

/**
 * Resolve a portrait/asset key to a full URL, or null when unconfigured.
 * @param {string|undefined|null} key e.g. "bots/kok_tengri.webp"
 * @returns {string|null}
 */
export function assetUrl(key) {
  if (!key || !BASE) return null;
  return `${BASE}/${String(key).replace(/^\/+/, '')}`;
}

/**
 * Turn a name into a portrait slug, e.g. "KÖK TENGRİ" → "kok_tengri",
 * "Fatih Sultan Mehmet II" → "fatih_sultan_mehmet_ii". Turkish letters are
 * folded to ASCII so the S3 keys are portable.
 * @param {string} name
 * @returns {string}
 */
export function slugify(name) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', Ö: 'o', Ş: 's', Ü: 'u' };
  return name
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (c) => map[c] ?? c)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default assetUrl;
