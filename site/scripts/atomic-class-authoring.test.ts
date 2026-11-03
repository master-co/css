import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import glob from 'fast-glob'
import { atomicClassIssue, createAtomicClassAudit, auditAuthoringRoots } from './atomic-class-authoring'

const root = fileURLToPath(new URL('../../', import.meta.url))

test('policy distinguishes class composition from native CSS and structured values', () => {
  for (const value of ['(border:1px|solid|red)', '(animation:fade|1s)', '(margin:1px|2px)', '(grid-column:1/3)', '(overflow:hidden|auto)']) assert.ok(atomicClassIssue(value), value)
  for (const value of ['(animation:none)@media(print)', '(transition:none)', '(outline:none)', '(white-space:nowrap)', '(text-decoration:underline)', 'p-sm', 'b-line-control', '(margin:1px|1px)', '(margin:var(--space,1px))', '(gap:1rem)', '(grid-area:main)', '(grid-column:span|2)', '(transform:translate(1px,2px))', '(background-image:linear-gradient(red,blue))', '(box-shadow:0|0|2px|red)']) assert.equal(atomicClassIssue(value), undefined, value)
  const audit = createAtomicClassAudit()
  try {
    assert.deepEqual(audit.inspect('<style>.x{border:1px solid red;margin:1px 2px}</style><div style="border:1px solid red"></div>', 'html'), [])
    assert.deepEqual(audit.inspect(`const x = <div style={{border: '1px solid red', margin: '1px 2px'}}/>`, 'typescriptreact'), [])
    assert.equal(audit.inspect('<div class="p-sm pt-lg"></div>', 'html').length, 1)
    assert.equal(audit.inspect('<div class="(border:1px|solid|red):hover"></div>', 'html').length, 1)
  } finally { audit.dispose() }
})

test('site and official markup examples use atomic class authoring', async () => {
  const shared = path.join(path.dirname(fileURLToPath(import.meta.resolve('@master/internal-site/package.json'))), 'src')
  const result = await auditAuthoringRoots([
    { name: 'site', directory: path.join(root, 'site'), patterns: ['{content,components,layouts,sections,reference,utils,scripts}/**/*.{astro,svelte,mdx,html,ts,tsx,js,jsx}'] },
    { name: 'shared', directory: shared },
    { name: 'examples', directory: path.join(root, 'examples') }
  ])
  for (const file of ['site/content/page.astro', 'site/content/components/AgentSession.svelte', 'site/content/guide/route-level-styles/content.mdx', 'site/sections/reference.astro', 'shared/docs-shell/components/DocHeader.svelte']) {
    assert.ok(result.inventory.includes(file), file)
  }
  // Keep independent teaching examples byte-for-byte stable. These exact
  // legacy examples predate atomic authoring; collision.mdx deliberately
  // demonstrates the ESLint diagnostic. New failures still fail the audit.
  assert.deepEqual(result.failures.map(({ file, token }) => ({ file, token })), [
    { file: 'examples/astro/src/components/Card.astro', token: '(border:1px|solid|#e2e8f0)' },
    { file: 'examples/astro/src/pages/index.astro', token: '(margin:1rem|0|0)' },
    { file: 'examples/astro/src/pages/index.astro', token: '(border:1px|solid|#e2e8f0)' },
    { file: 'examples/astro/src/pages/index.astro', token: '(margin:0.75rem|0|0)' },
    { file: 'examples/eslint/src/collision.mdx', token: 'm(32)' }
  ])
})

test('syntax tables describe single settings and independent properties', async () => {
  const files = await glob('site/content/**/reference/**/syntaxes.ts', { cwd: root })
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
