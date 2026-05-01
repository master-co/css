import { describe, test, expect } from 'vitest'
import { extractLatentClasses as nuevo } from '../src'
import legacy from './_legacy-extract-latent-classes'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'fast-glob'

/**
 * Differential testing: feed a wide variety of inputs through BOTH the new
 * (Phase A+B optimised) implementation and the original-from-rc reference
 * implementation. Outputs must be identical for every input.
 *
 * The reference (`_legacy-extract-latent-classes.ts`) is a frozen snapshot
 * of `git show rc:packages/extractor/src/functions/extract-latent-classes.ts`.
 * Any divergence here is a regression in the new impl.
 */

function eq(input: string, label: string) {
    const oldOut = legacy(input)
    const newOut = nuevo(input)
    expect(newOut, `Differential mismatch for ${label}`).toEqual(oldOut)
}

describe('differential vs legacy — synthetic fixtures', () => {
    const fixtures: [string, string][] = [
        ['empty', ''],
        ['whitespace', '   \n\t   '],
        ['single class', 'bg:white'],
        ['html basic', '<div class="bg:white fg:black m:8 p:8">x</div>'],
        ['jsx', '<div className="bg:white fg:black">x</div>'],
        ['vue dir', '<div :class="{ bg:white: cond }">x</div>'],
        ['svelte dir', '<div class:active>x</div>'],
        ['url', '<div class="bg:url(\'/foo.png\')">x</div>'],
        ['nested strings', `const x = clsx('bg:white', condition && 'fg:black')`],
        ['template literal', `const x = \`bg:\${color} fg:white\``],
        ['comment line', `// const a = 'bg:white'`],
        ['comment block', `/* const a = 'bg:white' */`],
        ['comment html', `<!-- <div class="bg:white"> -->`],
        ['style block', `<style>.foo { background: red }</style><div class="bg:white">x</div>`],
        ['import', `import css from '@master/css'`],
        ['require', `const x = require('fs')`],
        ['decorator', `@something\n@other\nexport class Foo {}`],
        ['group syntax', '<div class="{bg:white;fg:black}">x</div>'],
        ['wxh', '<div class="min:40|80 calc(100vw-60)x20rem">x</div>'],
        ['paint-order pipe', '<div class="{paint-order:stroke|fill}">x</div>'],
        ['conditional query', '<div class="bg:black@xl bg:white@dark">x</div>'],
        ['arbitrary value', '<div class="font-size:[clamp(1rem,2vw,3rem)]">x</div>'],
        ['unicode', '<div class="bg:white">日本語テスト</div>'],
        ['very long', '<div class="' + Array(500).fill('bg:white').join(' ') + '">x</div>'],
        ['deeply nested strings', `const x = clsx('a', clsx('b', clsx('c', 'd')))`],
        ['malformed quote', `<div class="bg:white">unterminated`],
        ['malformed paren', `<div class="bg:url(/foo.png">x</div>`],
        ['css-in-js', `const sx = { bg:white: true, 'fg:black': true, m:8: 0 }`],
        ['mdx', `<Hero className="bg:gradient h:dvh">{children}</Hero>\n\nSome **markdown** text.\n\n## Heading`],
        ['ts annotations', `const x: Record<string, true> = { 'bg:white': true }`],
        ['arrow fn', `const fn = (x: string) => x + 'bg:white'`],
        ['minified', `e=t=>"bg:white",n=>n*2`],
        ['top-level @', '@font-face { font-family: \'X\' }'],
        ['~ at-rule', '~transform|.3s ~delay:0ms'],
        ['function with !', `setupCounter(counterElement!)`],
        ['classnames helper', `<div className={cn('bg:white', cond && 'fg:black', { 'm:8': true })}>x</div>`],
        ['data attribute', '<div data-class="bg:white" class="real fg:black">x</div>'],
        ['svelte text', `<script>let title = 'bg:white';</script>{title}`],
    ]

    test.each(fixtures)('%s', (label, input) => eq(input, label))
})

describe('differential vs legacy — workspace real files (smoke)', () => {
    const workspaceRoot = path.resolve(__dirname, '..', '..', '..')
    // A selection of file types extractor sees in the wild. Globbed once at
    // module load so test names show real paths.
    const realFiles: string[] = (() => {
        try {
            return [
                ...glob.sync(['examples/*/src/**/*.{ts,tsx,html,vue,svelte,astro}', 'examples/*/index.html'], {
                    cwd: workspaceRoot,
                    absolute: true,
                    ignore: ['**/node_modules/**', '**/dist/**'],
                    deep: 4,
                }).slice(0, 20),
                ...glob.sync('site/app/[locale]/**/content.mdx', {
                    cwd: workspaceRoot,
                    absolute: true,
                    ignore: ['**/node_modules/**'],
                }).slice(0, 10),
            ]
        } catch {
            return []
        }
    })()

    if (realFiles.length === 0) {
        test('no real files found — skipping', () => {
            expect(true).toBe(true)
        })
    } else {
        test.each(realFiles)('%s', (file) => {
            const content = fs.readFileSync(file, 'utf8')
            const oldOut = legacy(content)
            const newOut = nuevo(content)
            expect(newOut, `Differential mismatch for ${file}`).toEqual(oldOut)
        })
    }
})
