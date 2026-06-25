import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { compilePlayCSS } from '../../../../play-compiler/compile-play-css'

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
    assert.match(result.css, /@layer utilities/)
    assert.match(result.css, /@layer components/)
    assert.match(result.css, /\.btn\{/)
    assert.match(result.css, /--color-master:/)
    assert.match(result.css, /--color-master-hover:/)
    assert.match(result.css, /--color-master-ink:/)
    assert.match(result.css, /--color-surface-base/)
    assert.match(result.css, /--color-text-body/)
    assert.match(result.css, /\.surface\\:base\{/)
    assert.match(result.css, /\.text\\:body\{/)
    assert.ok(result.css.includes('.btn:hover .btn-arrow-line{opacity:1;transform:scale(1)}'))
    assert.deepEqual(result.warnings, [])
    assert.equal(result.result.manifest, result.manifest)
    assert.deepEqual(result.result.warnings, result.warnings)
    assert.ok(result.css.length > 1000)
})

test('keeps native CSS while generating Play classes', async () => {
    const html = readFixture('../../../[locale]/play/templates/latest/example.html')
    const sourceCSS = readFixture('../../../[locale]/play/templates/latest/example.css') + '\n.native { color: var(--color-text-body); }'
    const result = await compilePlayCSS(sourceCSS, extractClassNamesFromHTML(html))

    assert.match(result.css, /\.native\s*\{\s*color:\s*var\(--color-text-body\);\s*\}/)
    assert.match(result.css, /\.surface\\:base\{/)
    assert.match(result.css, /\.btn\{/)
    assert.match(result.css, /--color-text-body/)
    assert.match(result.css, /--color-master:/)
    assert.deepEqual(result.warnings, [])
})

test('includes generated keyframes referenced by native CSS', async () => {
    const sourceCSS = '.native { animation: fade 1s; }'
    const result = await compilePlayCSS(sourceCSS, [])

    assert.match(result.css, /\.native\s*\{\s*animation:\s*(?:fade 1s|1s fade);\s*\}/)
    assert.match(result.css, /@keyframes fade/)
})

test('does not duplicate generated keyframes when native CSS defines them', async () => {
    const sourceCSS = [
        '@keyframes fade { to { opacity: .5; } }',
        '.native { animation-name: fade; animation-duration: 1s; }'
    ].join('\n')
    const result = await compilePlayCSS(sourceCSS, [])
    const matches = result.css.match(/@keyframes fade/g) || []

    assert.equal(matches.length, 1)
    assert.match(result.css, /@keyframes\s+fade/)
    assert.match(result.css, /\.native\s*\{\s*animation-name:\s*fade;\s*animation-duration:\s*1s;\s*\}/)
})
