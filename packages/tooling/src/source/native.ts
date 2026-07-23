import { createToolingBackendSync } from '@master/css-backend/tooling/node'

function binding() {
  return createToolingBackendSync()
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
