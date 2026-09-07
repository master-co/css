import { createToolingBindingSync } from '@master/css-binding/tooling/node'

function binding() {
  return createToolingBindingSync()
}

export function extractClassCandidatesNative(content: string): string[] {
  return [...binding().extractClassCandidates(content)]
}

export function extractOxcClassesNative(source: string, content: string): string[] {
  return [...binding().extractOxcClasses(source, content)]
}

export function extractHTMLClassesNative(source: string, content: string): string[] {
  return [...binding().extractHTMLClasses(source, content)]
}

export function extractAstroClassesNative(source: string, content: string): string[] {
  return [...binding().extractAstroClasses(source, content)]
}
