import { loadNativeBinding } from '@master/css-native'

function binding() {
  return loadNativeBinding({ required: true })!.binding
}

export function extractClassCandidatesNative(content: string): string[] {
  return binding().extractClassCandidates(content)
}

export function extractOxcClassesNative(source: string, content: string): string[] {
  return binding().extractOxcClasses(source, content)
}

export function extractHTMLClassesNative(source: string, content: string): string[] {
  return binding().extractHtmlClasses(source, content)
}

export function extractAstroClassesNative(source: string, content: string): string[] {
  return binding().extractAstroClasses(source, content)
}
