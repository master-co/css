import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { compilePlayCSS } from '../../../[locale]/play/compile-play-css'

function readFixture(path: string) {
    return readFileSync(new URL(path, import.meta.url), 'utf-8')
}

function extractClassNamesFromHTML(html: string) {
    return [...new Set([...html.matchAll(/\bclass\s*=\s*(["'])(.*?)\1/gs)]
        .flatMap((match) => match[2].split(/\s+/).filter(Boolean)))]
}

test('compiles the starter Play template into generated CSS', async () => {
    const html = readFixture('../../../[locale]/play/templates/latest/example.html')
    const sourceCSS = readFixture('../../../[locale]/play/templates/latest/example.css')
    const result = await compilePlayCSS(sourceCSS, extractClassNamesFromHTML(html))

    assert.match(result.css, /@layer theme/)
    assert.match(result.css, /@layer components/)
    assert.match(result.css, /\.card\{/)
    assert.match(result.css, /--color-card/)
    assert.ok(result.css.length > 1000)
})

test('keeps native CSS while generating Play classes', async () => {
    const html = readFixture('../../../[locale]/play/templates/latest/example.html')
    const sourceCSS = readFixture('../../../[locale]/play/templates/latest/example.css') + '\n.native { color: var(--color-card); }'
    const result = await compilePlayCSS(sourceCSS, extractClassNamesFromHTML(html))

    assert.match(result.css, /\.native\s*\{\s*color:\s*var\(--color-card\);\s*\}/)
    assert.match(result.css, /\.card\{/)
    assert.match(result.css, /--color-card/)
})
