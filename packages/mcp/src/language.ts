import { MasterCSSLanguageService } from '@master/css-language-service'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest, requireWorkspaceManifest, manifestMetadata, type SemanticContext } from './project'
import { createMCPTextDocument } from './document'

export interface SuggestSyntaxOptions {
  context?: SemanticContext
  content: string
  filePath: string
  position: {
    line: number
    character: number
  }
  triggerCharacter?: string
  limit?: number
}


export async function suggestSyntax(context: MasterCSSMCPContext, options: SuggestSyntaxOptions) {
  const filePath = context.resolveVirtualPath(options.filePath)
  const manifest = await loadWorkspaceManifest(context, options.context)
  const session = createToolingSessionSync({
    manifest: requireWorkspaceManifest(manifest)
  })
  const service = new MasterCSSLanguageService(
    { manifest: requireWorkspaceManifest(manifest) },
    { session }
  )
  try {
    const document = createMCPTextDocument(filePath, options.content)
    const completions = service.suggestSyntax(document, options.position, {
      triggerKind: options.triggerCharacter ? 2 : 1,
      ...(options.triggerCharacter ? { triggerCharacter: options.triggerCharacter } : {})
    }) ?? []
    const hover = service.inspectSyntax(document, options.position)
    const limit = options.limit ?? 50
    return {
      manifest: manifestMetadata(manifest),
      completions: completions.slice(0, limit),
      total: completions.length,
      hover
    }
  } finally {
    service.dispose()
  }
}
