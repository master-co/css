import type { NativeCSSDeclarationMatcher } from '@master/css-engine'

const supportsCache = new Map<string, boolean>()

export const browserNativeDeclarationMatcher: NativeCSSDeclarationMatcher = ({ property, value }) => {
    if (property.startsWith('--')) return true

    const cacheKey = property + '\0' + value
    const cached = supportsCache.get(cacheKey)
    if (cached !== undefined) return cached

    const supported = Boolean(globalThis.CSS?.supports(property, value))
    supportsCache.set(cacheKey, supported)
    return supported
}
