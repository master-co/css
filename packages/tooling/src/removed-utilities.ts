import type { MasterCSSDiagnostic, MasterCSSNativeDeclarationCandidate } from '@master/css-binding/tooling'

/** Rust supplies only actual native fallbacks. Explicit custom utility matches
 * never enter this projection, even when their public key is a retired name. */
export function removedUtilityDiagnostics(className: string, candidates: readonly MasterCSSNativeDeclarationCandidate[], nativeClassNames: ReadonlySet<string> = new Set()): MasterCSSDiagnostic[] {
  if (nativeClassNames.has(className)) return []
  return candidates.filter(candidate => candidate.className === className && ['size', 'min-size', 'max-size', 'min', 'max'].includes(candidate.property)).map(candidate => ({
    code: 'REMOVED_PRESET_UTILITY',
    phase: 'match',
    severity: 'info',
    message: `The built-in ${candidate.property} sizing utility was removed. Master no longer expands this input into paired dimensions; native declaration fallback remains and browser behavior may differ. Use explicit width/height properties or define a project utility.`,
    range: { start: 0, end: className.length },
    notes: ['Use master-css migrate --from rc-sizing with the saved RC manifest to review token identity and cascade order.']
  }))
}
