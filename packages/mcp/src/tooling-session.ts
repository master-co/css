import {
  type MasterCSSToolingSession,
  createToolingSessionSync
} from '@master/css-tooling/node'
import type {
  MasterCSSLanguageInspection
} from '@master/css-tooling/language'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export function createMCPToolingSession(manifest: MasterCSSManifest) {
  return createToolingSessionSync({ manifest })
}

export function compactClassInspection(
  session: MasterCSSToolingSession,
  className: string,
  mode?: string,
  includeRules = false,
  resolvedInspection?: MasterCSSLanguageInspection
) {
  const inspection = resolvedInspection ?? session.inspectClassName(className, mode)
  return {
    ...inspection,
    variables: inspection.variables.map(({ key, variable }) => ({
      key,
      variable: { ...variable, dependencies: [...(variable.dependencies ?? [])] }
    })),
    rules: inspection.rules.map((rule) => {
      if (includeRules) return rule
      const { text: _text, ...metadata } = rule
      return metadata
    })
  }
}
