import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../src/core'

test('stylesheet source exclusions and blocklists narrow module-graph scanning', async () => {
  // Outside the repository, so module-graph scanning is not hidden by its ignore rules.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-vite-source-policy-')))
  try {
    const files: Record<string, string> = {
      'index.html': '<main class="(display:block) fg-red"></main><script type="module" src="/src/main.ts"></script>',
      'src/main.ts': 'import "./app.css"; import { html } from "./legacy/old"; document.body.innerHTML += html',
      'src/legacy/old.ts': 'export const html = \'<div class="(margin:0)"></div>\'',
      'src/app.css': '@import "@master/css"; @source not "./legacy/**"; @blocklist "fg-red";'
    }
    for (const [file, source] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true })
      writeFileSync(join(root, file), source)
    }
    const result = await build({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), build: { write: false } })
    if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
    const css = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => String((asset as { source: string }).source)).join('\n')
    expect(css).toContain('.\\(display\\:block\\)')
    expect(css).not.toContain('.fg-red')
    expect(css).not.toContain('.\\(margin\\:0\\)')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
