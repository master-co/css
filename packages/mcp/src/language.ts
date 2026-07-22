import CSSLanguageService from '@master/css-language-service'
import { defaultManifest } from '@master/css-language'
import { createLanguageSessionSync } from '@master/css-language/node'
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

export async function suggestSyntax(context: MasterCSSMCPContext, options: SuggestSyntaxOptions) {
  const filePath = context.resolveVirtualPath(options.filePath)
  const manifest = await loadWorkspaceManifest(context)
  const session = createLanguageSessionSync(
    manifest.status === 'loaded' ? manifest.manifest : defaultManifest
  )
  const service = new CSSLanguageService(
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
