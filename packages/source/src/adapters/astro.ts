import { extractAstroClassesNative } from '../native'
import type { SourceAdapter, SourceAdapterInput } from './types'

export const ASTRO_SOURCE_EXT = /\.astro(?:\?|$)/

export function extractAstroClasses(source: string, content: string): string[] {
  return extractAstroClassesNative(source, content)
}

export function astroAdapter(): SourceAdapter {
  return {
    name: 'astro',
    test: ASTRO_SOURCE_EXT,
    async extract({ source, content }: SourceAdapterInput) {
      return extractAstroClasses(source, content)
    }
  }
}
