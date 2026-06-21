import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))

function readSources(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const file = join(directory, entry.name)
        if (entry.isDirectory()) return readSources(file)
        return entry.isFile() && file.endsWith('.ts') ? [readFileSync(file, 'utf8')] : []
    })
}

test('does not depend on CSS language documentation data', () => {
    const source = [
        readFileSync(join(packageDir, 'package.json'), 'utf8'),
        ...readSources(join(packageDir, 'src'))
    ].join('\n')

    const forbidden = [
        ['vscode', 'css', 'languageservice'].join('-'),
        ['getCSS', 'DataDocumentation'].join(''),
        ['Markup', 'Content'].join(''),
        ['css', 'data', 'provider'].join('-'),
        ['mdn', 'url'].join('_'),
        ['developer', 'mozilla'].join('.'),
        ['Can I', 'use'].join(' ')
    ]

    for (const value of forbidden) {
        expect(source).not.toContain(value)
    }
})
