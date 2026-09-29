import { MASTER_CSS_DIAGNOSTIC_VERSION, type MasterCSSDiagnostic } from '@master/css-schema'
import type { CSSDirectiveNotice } from '@master/css-schema/css-directives'

/** Adapt Rust source locations to the public, zero-based diagnostic envelope. */
export function noticeDiagnostics(notices: readonly CSSDirectiveNotice[] | undefined, onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void) {
  return (notices || []).map(({ code, message, source }): MasterCSSDiagnostic => {
    const diagnostic: MasterCSSDiagnostic = Object.freeze({
      version: MASTER_CSS_DIAGNOSTIC_VERSION,
      code, message, domain: 'compiler', phase: 'compiler', severity: 'information',
      ...(source?.file ? { source: source.file } : {}),
      ...(source?.loc ? { range: {
        start: { line: source.loc.start.line - 1, character: source.loc.start.column - 1 },
        end: { line: source.loc.end.line - 1, character: source.loc.end.column - 1 }
      } } : {})
    })
    onDiagnostic?.(diagnostic)
    return diagnostic
  })
}
