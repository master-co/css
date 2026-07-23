import { MasterCSSLanguageService } from '@master/css-language-service'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest } from './project'
import { createMCPTextDocument } from './document'

export interface SuggestSyntaxOptions {
  content: string
  filePath: string
  position: {
    line: number
    character: number
  }
  triggerCharacter?: string
  limit?: number
}

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export async function suggestSyntax(context: MasterCSSMCPContext, options: SuggestSyntaxOptions) {
  const filePath = context.resolveVirtualPath(options.filePath)
  const manifest = await loadWorkspaceManifest(context)
  const session = createToolingSessionSync({
    manifest: manifest.status === 'loaded' ? manifest.manifest : defaultManifest
  })
  const service = new MasterCSSLanguageService(
    manifest.status === 'loaded' ? { manifest: manifest.manifest } : undefined,
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
      manifest: {
        status: manifest.status,
        entries: manifest.entries,
        ...(manifest.status === 'error' ? { error: manifest.error } : {})
      },
      completions: completions.slice(0, limit),
      total: completions.length,
      hover
    }
  } finally {
    service.dispose()
  }
}
