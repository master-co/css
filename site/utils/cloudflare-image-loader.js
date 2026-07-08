const defaultQuality = 75
const bitmapImageExtensionPattern = /\.(?:avif|jpe?g|png|webp)$/i
const forcedBooleanValues = new Map([
  ['true', true],
  ['false', false],
])

/**
 * @param {{ src: string, width: number, quality?: number }} props
 */
export default function cloudflareImageLoader({ src, width, quality }) {
  return createCloudflareImageUrl({
    src,
    width,
    quality,
    siteUrl: process.env.NEXT_PUBLIC_URL
  })
}

/**
 * @param {{ src?: string, width?: number | string, quality?: number | string, siteUrl?: string }} options
 */
export function createCloudflareImageUrl({ src, width, quality, siteUrl }) {
  if (!src || !siteUrl || src.startsWith('data:') || src.startsWith('blob:')) {
    return src
  }

  let baseUrl
  let sourceUrl
  try {
    baseUrl = new URL(siteUrl)
    sourceUrl = new URL(src, baseUrl)
  } catch {
    return src
  }

  if (!isMasterCoHost(baseUrl.hostname)) return src
  if (sourceUrl.origin !== baseUrl.origin) return src
  if (sourceUrl.pathname.startsWith('/cdn-cgi/image/')) return src
  if (!bitmapImageExtensionPattern.test(sourceUrl.pathname)) return src

  const normalizedWidth = normalizePositiveInteger(width)
  if (!normalizedWidth) return src

  const normalizedQuality = normalizePositiveInteger(quality) || defaultQuality
  const options = [
    `width=${normalizedWidth}`,
    `quality=${normalizedQuality}`,
    'format=auto'
  ].join(',')

  return `${baseUrl.origin}/cdn-cgi/image/${options}${sourceUrl.pathname}${sourceUrl.search}`
}

/**
 * @param {{ env?: Record<string, string | undefined>, siteUrl?: string }} [options]
 */
export function shouldUseCloudflareImageLoader({ env = process.env, siteUrl = env.NEXT_PUBLIC_URL } = {}) {
  const forcedValue = forcedBooleanValues.get(env.MASTER_CSS_IMAGE_TRANSFORMATIONS)
  if (typeof forcedValue === 'boolean') return forcedValue

  return isMasterCoUrl(siteUrl) && isCloudflarePages(env)
}

/**
 * @param {string | undefined} siteUrl
 */
export function isMasterCoUrl(siteUrl) {
  try {
    return isMasterCoHost(new URL(siteUrl).hostname)
  } catch {
    return false
  }
}

/**
 * @param {string} hostname
 */
export function isMasterCoHost(hostname) {
  return hostname === 'master.co' || hostname.endsWith('.master.co')
}

/**
 * @param {Record<string, string | undefined>} env
 */
function isCloudflarePages(env) {
  return env.CF_PAGES === '1' || Boolean(env.CF_PAGES_BRANCH || env.CF_PAGES_URL)
}

/**
 * @param {number | string | undefined} value
 */
function normalizePositiveInteger(value) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue <= 0) return undefined
  return Math.round(numberValue)
}
