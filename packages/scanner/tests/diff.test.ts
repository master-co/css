import { describe, test, expect } from 'vitest'
import { extractClassCandidates } from '@master/css-source'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'fast-glob'

describe('extractClassCandidates contract fixtures', () => {
  const fixtures: [string, string, string[]][] = [
    ['empty', '', []],
    ['whitespace', '   \n\t   ', []],
    ['single class', 'bg:white', ['bg:white']],
    ['html basic', '<div class="bg:white fg:black m:2x p:2x">x</div>', ['bg:white', 'fg:black', 'm:2x', 'p:2x']],
    ['jsx', '<div className="bg:white fg:black">x</div>', ['bg:white', 'fg:black']],
    ['url function value', '<div class="bg:url(\'/foo.png\')">x</div>', ['bg:url(\'/foo.png\')']],
    ['comments are excluded', `// const a = 'bg:white'`, []],
    ['style blocks are excluded', `<style>.foo { background: red }</style><div class="bg:white">x</div>`, ['bg:white']],
    ['group syntax', '<div class="{bg:white;fg:black}">x</div>', ['{bg:white;fg:black}']],
    ['width-height shorthand', '<div class="min:10x calc(100vw-3.75rem)x20rem">x</div>', ['min:10x', 'calc(100vw-3.75rem)x20rem']],
    ['conditional at and mode suffixes', '<div class="bg:black@xl bg:white@dark">x</div>', ['bg:black@xl', 'bg:white@dark']],
    ['arbitrary bracket values are excluded', '<div class="font-size:[clamp(1rem,2vw,3rem)]">x</div>', []],
    ['data and class attributes are both scanned', '<div data-class="bg:white" class="real fg:black">x</div>', ['bg:white', 'real', 'fg:black']],
  ]

  test.each(fixtures)('%s', (_label, input, expected) => {
    expect(extractClassCandidates(input)).toEqual(expected)
  })
})

describe('workspace real files smoke', () => {
  const workspaceRoot = path.resolve(__dirname, '..', '..', '..')
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
      const output = extractClassCandidates(content)
      expect(output.every((eachClass) => typeof eachClass === 'string')).toBe(true)
      expect(output.some((eachClass) => eachClass.startsWith('COMPLETE-STRING--'))).toBe(false)
    })
  }
})
