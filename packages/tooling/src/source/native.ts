import { MasterCSSError } from '@master/css-schema'
import { createToolingBindingSync } from '@master/css-binding/tooling/node'

function binding() {
  return createToolingBindingSync()
}

export function extractClassCandidatesNative(content: string): string[] {
  return [...binding().extractClassCandidates(content)]
}

export function extractOxcClassesNative(source: string, content: string): string[] {
  const session = binding().createSourceSession()
  try {
    const result = session.extract({ files: [{ source, content, kind: 'oxc' }] }).files[0]
    if (result.diagnostics.length) {
      const position = (offset: number) => { const lines = content.slice(0, offset).split('\n'); return { line: lines.length - 1, character: lines.at(-1)!.length } }
      throw new MasterCSSError({ code: 'SOURCE_PARSE_ERROR', domain: 'tooling', message: result.diagnostics[0].message, diagnostics: result.diagnostics.map(diagnostic => ({
        ...diagnostic, version: 2, domain: 'tooling' as const, severity: diagnostic.severity === 'info' ? 'information' as const : diagnostic.severity,
        range: diagnostic.range ? { start: position(diagnostic.range.start), end: position(diagnostic.range.end) } : undefined
      })) })
    }
    return [...result.candidates]
  } finally { session.dispose() }
}

export function extractHTMLClassesNative(source: string, content: string): string[] {
  return [...binding().extractHTMLClasses(source, content)]
}

export function extractAstroClassesNative(source: string, content: string): string[] {
  return [...binding().extractAstroClasses(source, content)]
}
