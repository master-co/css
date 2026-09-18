import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

test('local entry survives CSS optimization when its hash begins with an exponent', async () => {
  const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
  const root = realpathSync(mkdtempSync(join(parent, 'local-exponent-slot-')))
  try {
    let filename = ''
    // Choose a real file whose identity exercises numeric-token normalization.
    for (let i = 0; i < 10000; i++) {
      const candidate = `entry-${i}.css`
      if (/^\d+e\d{3}/.test(createHash('sha256').update(join(root, candidate)).digest('hex'))) { filename = candidate; break }
    }
    expect(filename).not.toBe('')
    writeFileSync(join(root, filename), '.exponent{@compose inline-flex;}')
    writeFileSync(join(root, 'control.css'), '.control{@compose block;}')
    writeFileSync(join(root, 'client.js'), `import "./control.css";import "./${filename}";`)
    writeFileSync(join(root, 'index.html'), '<script type="module" src="./client.js"></script>')
    const result = await build({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), build: { write: false } })
    if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
    const css = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => asset.type === 'asset' ? String(asset.source) : '').join('\n')
    expect(css).toContain('.exponent{display:inline-flex}')
    expect(css).toContain('.control{display:block}')
    expect(css).not.toContain('#master-css-local-')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
