import {
  createRustLanguageAnalyzer,
  type MasterCSSLanguageInspectionIR,
  type RustLanguageAnalyzer
} from '@master/css-language/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export async function createMCPRustLanguageSession(manifest: MasterCSSManifest) {
  const analyzer = await createRustLanguageAnalyzer()
  const session = analyzer.createSession?.(manifest)
  if (!session?.inspectClassName) {
    analyzer.dispose?.()
    throw new Error('The Rust language backend does not provide class inspection sessions.')
  }
  return session as RustLanguageAnalyzer & {
    inspectClassName(className: string, mode?: string): MasterCSSLanguageInspectionIR
  }
}

export function compactRustClassInspection(
  session: Awaited<ReturnType<typeof createMCPRustLanguageSession>>,
  className: string,
  mode?: string,
  includeRules = false,
  resolvedInspection?: MasterCSSLanguageInspectionIR
) {
  const inspection = resolvedInspection ?? session.inspectClassName(className, mode)
  return {
    valid: inspection.valid,
    base: inspection.base,
    suffix: inspection.suffix,
    key: inspection.key,
    value: inspection.value,
    keyToken: inspection.keyToken,
    valueToken: inspection.valueToken,
    stateToken: inspection.stateToken,
    important: inspection.important || undefined,
    matcherTypes: inspection.matcherTypes,
    variables: inspection.variables.map(({ key, variable }) => ({
      key,
      variable: {
        ...variable,
        ...(variable.dependencies ? { dependencies: new Set(variable.dependencies) } : {})
      }
    })),
    rules: inspection.rules.map((rule) => ({
      className: rule.className,
      layer: rule.layer,
      type: rule.type,
      ...(includeRules ? { text: rule.text } : {})
    }))
  }
}
