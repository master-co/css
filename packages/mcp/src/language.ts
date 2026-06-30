import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import CSSLanguageService from '@master/css-language-service'
import { TextDocument } from 'vscode-languageserver-textdocument'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest } from './project'

const languageByExtension: Record<string, string> = {
    '.astro': 'astro',
    '.css': 'css',
    '.htm': 'html',
    '.html': 'html',
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.less': 'less',
    '.md': 'markdown',
    '.mdx': 'mdx',
    '.scss': 'scss',
    '.svelte': 'svelte',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.vue': 'vue'
}

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
    const service = new CSSLanguageService(manifest.status === 'loaded' ? { manifest: manifest.manifest } : undefined)
    const document = TextDocument.create(
        pathToFileURL(filePath).href,
        languageByExtension[extname(filePath).toLowerCase()] || 'html',
        0,
        options.content
    )
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
}
