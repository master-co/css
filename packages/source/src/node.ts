import { NativeBindingError } from '@master/css-native'
import { createNativeSourceExtractor, type SourceExtractor } from './session'

export type { SourceExtractor } from './session'

export function createSourceExtractorSync(): SourceExtractor {
  const extractor = createNativeSourceExtractor()
  if (extractor) return extractor
  throw new NativeBindingError(
    'NATIVE_UNAVAILABLE',
    'createSourceExtractorSync() requires the Master CSS native binding.'
  )
}
