import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import glob from 'fast-glob'
import { atomicClassIssue, createAtomicClassAudit } from './atomic-class-authoring'

const root = fileURLToPath(new URL('../../', import.meta.url))

test('policy distinguishes class composition from native CSS and structured values', () => {
  for (const value of ['border:1px|solid|red', 'animation:fade|1s', 'margin:1px|2px', 'grid-column:1/3', 'overflow:hidden|auto']) assert.ok(atomicClassIssue(value), value)
  for (const value of ['animation:none@media(print)', 'transition:none', 'outline:none', 'white-space:nowrap', 'text-decoration:underline', 'p-sm', 'b-line-control', 'margin:1px|1px', 'margin:var(--space,1px)', 'gap:1rem', 'grid-area:main', 'grid-column:span|2', 'transform:translate(1px,2px)', 'background-image:linear-gradient(red,blue)', 'box-shadow:0|0|2px|red']) assert.equal(atomicClassIssue(value), undefined, value)
  const audit = createAtomicClassAudit()
  try {
    assert.deepEqual(audit.inspect('<style>.x{border:1px solid red;margin:1px 2px}</style><div style="border:1px solid red"></div>', 'html'), [])
    assert.deepEqual(audit.inspect(`const x = <div style={{border: '1px solid red', margin: '1px 2px'}}/>`, 'typescriptreact'), [])
    assert.equal(audit.inspect('<div class="p-sm pt-lg"></div>', 'html').length, 1)
    assert.equal(audit.inspect('<div class="border:1px|solid|red:hover"></div>', 'html').length, 1)
  } finally { audit.dispose() }
})

test('site and official markup examples use atomic class authoring', async () => {
  // Historical migration evidence and intentional invalid-input tests are not authoring examples.
  const files = await glob(['site/{app,components,docs-shell,utils}/**/*.{tsx,ts,mdx,html}', 'examples/**/*.{tsx,jsx,vue,svelte,html}'], {
    cwd: root,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.test.*', '**/*.spec.*', '**/tests/**', '**/guide/migration/**']
  })
  const audit = createAtomicClassAudit()
  const failures: string[] = []
  try {
    for (const file of files) {
      const source = await readFile(path.join(root, file), 'utf8')
      const language = /\.[jt]sx?$/.test(file) ? 'typescriptreact' : 'html'
      for (const issue of audit.inspect(source, language)) {
        failures.push(`${file}:${source.slice(0, issue.range.start).split('\n').length}: ${issue.token}: ${issue.message}`)
      }
      // Demo generators also store markup in escaped JavaScript string literals.
      if (language === 'typescriptreact') {
        for (const match of source.matchAll(/"(?:\\.|[^"\\])*"/g)) {
          if (!match[0].includes('class=\\"')) continue
          const html = JSON.parse(match[0]) as string
          for (const issue of audit.inspect(html, 'html')) {
            failures.push(`${file}:${source.slice(0, match.index).split('\n').length}: ${issue.token}: ${issue.message}`)
          }
        }
      }
    }
  } finally { audit.dispose() }
  assert.deepEqual(failures, [])
})

test('syntax tables describe single settings and independent properties', async () => {
  const files = await glob('site/app/**/reference/**/syntaxes.ts', { cwd: root })
  const failures: string[] = []
  for (const file of files) {
    const source = await readFile(path.join(root, file), 'utf8')
    for (const line of source.split('\n')) {
      const value = line.match(/(?:\[\s*)?["']([^"']+)["']/)?.[1]
      if (value && atomicClassIssue(value)) failures.push(`${file}: ${value}`)
    }
  }
  assert.deepEqual(failures, [])
})
