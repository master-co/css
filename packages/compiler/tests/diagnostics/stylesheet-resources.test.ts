import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createMasterCSSInspectionReport } from '../../src/diagnostics'

test('project inspection keeps stylesheet entries that reference resources', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-inspect-resources-')))
  try {
    mkdirSync(join(cwd, 'node_modules/@master/css'), { recursive: true })
    writeFileSync(join(cwd, 'node_modules/@master/css/package.json'), JSON.stringify({ name: '@master/css', style: './index.css' }))
    writeFileSync(join(cwd, 'node_modules/@master/css/index.css'), '@utility block {display:block}')
    mkdirSync(join(cwd, 'src/styles'), { recursive: true })
    mkdirSync(join(cwd, 'src/fonts'), { recursive: true })
    writeFileSync(join(cwd, 'src/fonts/brand.woff2'), 'font')
    writeFileSync(join(cwd, 'src/styles/global.css'), "@import '@master/css';\n@font-face { font-family: Brand; src: url('../fonts/brand.woff2') format('woff2') }\n")
    writeFileSync(join(cwd, 'src/index.html'), '<p class="block"></p>')
    const report = await createMasterCSSInspectionReport({
      manifest: defaultManifestJSON as unknown as MasterCSSManifest,
      cwd, includeCss: true
    })
    expect(report.diagnostics.filter(diagnostic => diagnostic.severity === 'error')).toEqual([])
    expect(report.stylesheets.entries.map(entry => basename(entry.filePath))).toEqual(['global.css'])
    expect(report.files.map(file => basename(file.filePath))).toEqual(['index.html'])
    expect(report.scanner.classes.valid).toContain('block')
    expect(report.css.text).toContain(pathToFileURL(join(cwd, 'src/fonts/brand.woff2')).href)
    expect(report.css.text).toContain('.block{display:block}')
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})
