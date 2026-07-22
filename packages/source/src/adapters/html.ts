import { extractHTMLClassesNative } from '../native'
import type { SourceAdapter } from './types'

export const HTML_SOURCE_EXT = /\.html?(?:\?|$)/

export function extractHTMLClasses(source: string, content: string): string[] {
  return extractHTMLClassesNative(source, content)
}

export function htmlAdapter(): SourceAdapter {
  return {
    name: 'html',
    test: HTML_SOURCE_EXT,
    async extract({ source, content }) {
      return extractHTMLClasses(source, content)
    }
  }
}
