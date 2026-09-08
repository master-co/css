import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import MasterCSSMCPContext from '../src/context'
import { previewDirectiveFormat } from '../src/format'
import { renderCSS } from '../src/scan'

test('BH-0020 directive formatting reports UTF-8 sizes in content and file previews', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-format-bytes-'))
  const context = new MasterCSSMCPContext({ root })
  const content = '/* 中文😀 */\n@compose   block   inline ;'
  try {
    const result = await previewDirectiveFormat(context, { content })
    expect(result.mode).toBe('content')
    expect(result.files[0].beforeBytes).toBe(Buffer.byteLength(content, 'utf8'))
    expect(result.formatted).toContain('中文😀')
    expect(result.files[0].afterBytes).toBe(Buffer.byteLength(result.formatted!, 'utf8'))
    writeFileSync(join(root, 'index.css'), content)
    const files = await previewDirectiveFormat(context, { patterns: ['index.css'] })
    expect(files.mode).toBe('files')
    expect(files.preview!.changes).toHaveLength(1)
    expect(files.files[0].beforeBytes).toBe(files.preview!.changes[0].beforeBytes)
    expect(files.files[0].afterBytes).toBe(files.preview!.changes[0].afterBytes)
  } finally {
    context.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

test('BH-0020 rendered CSS bytes count UTF-8 Unicode output', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-render-bytes-'))
  const context = new MasterCSSMCPContext({ root })
  try {
    const result = await renderCSS(context, { classList: "content:'中文😀'" })
    expect(result.invalid).toEqual([])
    expect(result.css.text).toContain('中文😀')
    expect(result.css.bytes).toBe(Buffer.byteLength(result.css.text, 'utf8'))
  } finally {
    context.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})
