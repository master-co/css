import { createHash } from 'node:crypto'
import MagicString from 'magic-string'
import type { CSSOptions } from 'vite'

type AdditionalData = NonNullable<NonNullable<CSSOptions['preprocessorOptions']>['scss']>['additionalData']

/** Keep input identities visible through Sass and Vite's source-map chaining. */
export function createSassSourceMarkers(onSource?: (file: string, source: string) => void) {
  const markers = new Set<string>()
  return { markers, additionalData(value: AdditionalData): AdditionalData {
    return async (source, id) => {
      onSource?.(id, source)
      const marker = `!master-css:module-input-${createHash('sha256').update(id).digest('hex')}`
      markers.add(marker)
      // Also retain the root input: Vite chains a single-source partial map
      // through the root additionalData map even when they name different files.
      const suffix = `\n/*${marker}*/`
      if (typeof value === 'function') {
        const result = await value(source, id)
        if (result === source) {
          const edited = new MagicString(source).append(suffix)
          return { content: edited.toString(), map: edited.generateMap({ hires: 'boundary', source: id, file: id, includeContent: true }) }
        }
        return typeof result === 'string' ? result + suffix : { ...result, content: result.content + suffix }
      }
      const edited = new MagicString(source)
      if (value) edited.prepend(value)
      edited.append(suffix)
      return { content: edited.toString(), map: edited.generateMap({ hires: 'boundary', source: id, file: id, includeContent: true }) }
    }
  } }
}
