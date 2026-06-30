import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { TextDocument } from 'vscode-languageserver-textdocument'

export interface Position {
    line: number
    character: number
}

export interface Range {
    start: Position
    end: Position
}

export interface TextEdit {
    range: Range
    newText: string
}

export const languageByExtension: Record<string, string> = {
    '.astro': 'astro',
    '.css': 'css',
    '.htm': 'html',
    '.html': 'html',
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.less': 'less',
    '.md': 'markdown',
    '.mdx': 'mdx',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.mts': 'typescript',
    '.cts': 'typescript',
    '.php': 'php',
    '.pug': 'pug',
    '.scss': 'scss',
    '.svelte': 'svelte',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.vue': 'vue'
}

export function getLanguageId(filePath: string) {
    return languageByExtension[extname(filePath).toLowerCase()] || 'html'
}

export function createMCPTextDocument(filePath: string, content: string) {
    return TextDocument.create(
        pathToFileURL(filePath).href,
        getLanguageId(filePath),
        0,
        content
    )
}

export function toOffsetRange(document: TextDocument, range?: Range) {
    if (!range) return
    return {
        start: document.offsetAt(range.start),
        end: document.offsetAt(range.end)
    }
}

export function applyTextEdits(content: string, document: TextDocument, edits: TextEdit[]) {
    let result = content
    const offsetEdits = edits.map((edit) => ({
        start: document.offsetAt(edit.range.start),
        end: document.offsetAt(edit.range.end),
        newText: edit.newText
    }))
    for (const edit of offsetEdits.sort((a, b) => b.start - a.start || b.end - a.end)) {
        result = result.slice(0, edit.start) + edit.newText + result.slice(edit.end)
    }
    return result
}
