import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { contentsManifest as defaultManifestJSON } from '../helpers/contents-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { createStylesheetCollection } from '../../src/stylesheet/index-public'

const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest
const digest = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 16)

async function compose(files: Record<string, string>, inlineImports?: boolean) {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-delivery-inline-'))
  const packageRoot = join(cwd, 'node_modules/@master/css')
  mkdirSync(packageRoot, { recursive: true })
  writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name: '@master/css', style: './index.css' }))
  writeFileSync(join(packageRoot, 'index.css'), "@import './base.css';@import './empty.css';")
  writeFileSync(join(packageRoot, 'base.css'), '@layer base{.from-master{color:gray}}')
  writeFileSync(join(packageRoot, 'empty.css'), '')
  for (const [file, source] of Object.entries(files)) writeFileSync(join(cwd, file), source)
  const scanner = new MasterCSSScanner({ manifest: baseManifest }, cwd)
  const collection = createStylesheetCollection()
  const delivery = {
    entryURL: './output.css', relativeResourceURLs: true, inlineImports,
    stylesheetURL: (file: string, variant?: string) => `./sheet-${digest(variant ?? file)}.css`,
    resourceURL: (file: string) => `./resource-${digest(readFileSync(file, 'utf8'))}.svg`
  }
  try {
    await scanner.init()
    await collection.register(scanner, join(cwd, 'entry.css'), files['entry.css'], { baseManifest, projectDir: cwd, delivery })
    return await collection.compose({ scanner, baseManifest, projectDir: cwd, delivery })
  } finally { await scanner.dispose(); collection.dispose(); rmSync(cwd, { recursive: true, force: true }) }
}

function expectOrdered(css: string, markers: string[]) {
  const positions = markers.map(marker => css.indexOf(marker))
  expect(markers.filter((_, index) => positions[index] < 0), css).toEqual([])
  expect(positions).toEqual([...positions].sort((a, b) => a - b))
}

const localGraph = {
  'entry.css': "@layer reset, app;@import 'https://remote.test/font.css';@import '@master/css';@import './child.css' layer(reset);@import './print.css' print;.after{background-image:url('./image.svg')}",
  'child.css': '.child{color:blue}',
  'print.css': '.print{color:black}',
  'image.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>'
}

test('delivered inlining flattens local imports into the entry in cascade order', async () => {
  const result = await compose(localGraph, true)
  expect(result.stylesheets).toEqual([])
  expect(result.resources).toHaveLength(1)
  // Only the external import remains; layer and media qualifiers become equivalent wrappers.
  expect(result.css.match(/@import/g)).toHaveLength(1)
  expectOrdered(result.css, ['@layer reset, app;', '@import "https://remote.test/font.css";', '.from-master', '@layer reset{', '.child', '@media print', '.print', `url("${result.resources![0].href}")`])
})

test('delivery keeps separate stylesheet assets unless inlining is requested', async () => {
  const result = await compose(localGraph)
  expect(result.stylesheets!.length).toBeGreaterThan(1)
  expect(result.css).toContain('@import "./sheet-')
})

test('delivered inlining returns only stylesheets that retained boundaries still import', async () => {
  const result = await compose({
    'entry.css': "@import '@master/css';@import './remote.css';.after{color:green}",
    // The external import cannot follow inlined rules, so this child keeps its boundary.
    'remote.css': "@import 'https://remote.test/font.css';.remote{color:red}"
  }, true)
  const assets = new Map(result.stylesheets!.map(asset => [asset.href, asset.css]))
  const visited = new Set<string>()
  const expand = (css: string): string => css.replace(/@import "(\.\/sheet-[^"]+)";/g, (_, href: string) => {
    visited.add(href)
    expect(assets.get(href)?.trim(), href).toBeTruthy()
    return expand(assets.get(href)!)
  })
  const css = expand(result.css)
  expect([...visited].sort()).toEqual([...assets.keys()].sort())
  expectOrdered(css, ['.from-master', '@import "https://remote.test/font.css";', '.remote', '.after'])
})
