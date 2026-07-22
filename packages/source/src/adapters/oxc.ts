import { extractOxcClassesNative } from '../native'
import type { SourceAdapter } from './types'

export const OXC_SOURCE_EXT = /\.(?:(?:[cm]?[jt]s)|(?:[jt]sx))(?:\?|$)/

export function extractOxcClasses(source: string, content: string): string[] {
  return extractOxcClassesNative(source, content)
}

export function oxcAdapter(): SourceAdapter {
  return {
    name: 'oxc',
    test: OXC_SOURCE_EXT,
    async extract({ source, content }) {
      return extractOxcClasses(source, content)
    }
  }
}
