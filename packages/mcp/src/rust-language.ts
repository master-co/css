import {
  type LanguageSession,
  type MasterCSSLanguageInspectionIR
} from '@master/css-tooling/language'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export async function createMCPRustLanguageSession(manifest: MasterCSSManifest) {
  return createLanguageSessionSync(manifest)
}

export function compactRustClassInspection(
  session: LanguageSession,
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
