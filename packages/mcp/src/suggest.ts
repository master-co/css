import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest, requireWorkspaceManifest, manifestMetadata, type SemanticContext } from './project'
import { createMCPToolingSession } from './tooling-session'

export async function suggestClasses(context: MasterCSSMCPContext, options: { declarations: string; context?: SemanticContext }) {
  const manifest = await loadWorkspaceManifest(context, options.context)
  using session = createMCPToolingSession(requireWorkspaceManifest(manifest))
  const report = session.suggestClasses(options.declarations)
  const inspections = report.classes.map(className => session.inspectClassName(className))
  return {
    ...report,
    manifest: manifestMetadata(manifest),
    diagnostics: inspections.flatMap(inspection => inspection.diagnostics ?? []),
    validation: inspections.map(({ className, matchStatus, cssSyntaxStatus, cssValueStatus, browserSupport }) => ({
      className, matchStatus, cssSyntaxStatus, cssValueStatus, browserSupport
    }))
  }
}
