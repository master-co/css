import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

async function fixture(run: (root: string, compile: () => Promise<Extract<Awaited<ReturnType<typeof build>>, { output: unknown }>>) => Promise<void>) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-inline-test-')))
  try {
    mkdirSync(join(root, 'src'))
    writeFileSync(join(root, 'index.html'), '<div class="example"></div><script type="module" src="./src/main.js"></script>')
    writeFileSync(join(root, 'src/main.js'), 'import css from "./style.css?inline"; window.inlineCSS = css')
    const compile = async () => {
      const result = await build({ root, configFile: false, logLevel: 'silent', base: './', plugins: [masterCSS({ mode: 'static', runtime: false })], build: { write: false, minify: false } })
      if (Array.isArray(result) || 'on' in result) throw new Error('Expected one output bundle')
      return result
    }
    await run(root, compile)
  } finally { rmSync(root, { recursive: true, force: true }) }
}

test('BH-0004 inline imports export completed CSS without automatic stylesheet injection', async () => {
  await fixture(async (root, compile) => {
    writeFileSync(join(root, 'src/style.css'), '@master entry;@preserve native;.example{color:blue}')
    const result = await compile()
    const js = result.output.filter(o => o.type === 'chunk').map(o => o.code).join('\n')
    const html = result.output.find(o => o.type === 'asset' && o.fileName === 'index.html')
    expect(html?.type === 'asset' && String(html.source)).not.toContain('rel="stylesheet"')
    expect(js).toMatch(/color:\\n?\s*#00f|color:\s*#00f/)
    expect(js).not.toMatch(/[\"']__MASTER_CSS_INLINE_[a-f0-9]+__[\"']/)
    expect(js).not.toContain('master-css-slot')
  })
})

test('BH-0004 changing inline CSS changes the JS hash and repeated output stays stable', async () => {
  await fixture(async (root, compile) => {
    const entries = []
    for (const color of ['red', 'blue', 'red']) {
      writeFileSync(join(root, 'src/style.css'), `@master entry;@preserve native;.example{color:${color}}`)
      const result = await compile()
      entries.push(result.output.find(o => o.type === 'chunk' && o.isEntry)?.fileName)
    }
    expect(entries[0]).not.toBe(entries[1])
    expect(entries[0]).toBe(entries[2])
  })
})

test('BH-0004 retained external imports and resources publish beside the inline URL base', async () => {
  await fixture(async (root, compile) => {
    writeFileSync(join(root, 'src/style.css'), '@import "./child.css" layer(shared) print;@master entry;@preserve native;')
    writeFileSync(join(root, 'src/child.css'), '@import "https://external.test/style.css";.example{background:url(pixel.svg)}')
    writeFileSync(join(root, 'src/pixel.svg'), '<svg/>')
    const result = await compile()
    const assets = result.output.filter(o => o.type === 'asset')
    expect(assets.some(o => o.fileName.endsWith('.svg'))).toBe(true)
    expect(assets.some(o => String(o.source).includes('https://external.test/style.css'))).toBe(true)
    expect(assets.filter(o => o.fileName.endsWith('.css')).every(o => !String(o.source).includes('master-css-inline.invalid'))).toBe(true)
  })
})


test('BH-0004 URL delivery preserves opaque author strings containing the internal URL prefix', async () => {
  await fixture(async (root, compile) => {
    writeFileSync(join(root, 'src/style.css'), '@master entry;@preserve native;.example{--literal:"https://master-css-inline.invalid/literal";background:url(pixel.svg)}')
    writeFileSync(join(root, 'src/pixel.svg'), '<svg/>')
    const result = await compile()
    const js = result.output.filter(o => o.type === 'chunk').map(o => o.code).join('\n')
    expect(js).toContain('https://master-css-inline.invalid/literal')
    expect(result.output.some(o => o.fileName.endsWith('.svg'))).toBe(true)
  })
})

test('BH-0004 fully inlined descendants are not emitted as unused CSS files', async () => {
  await fixture(async (root, compile) => {
    writeFileSync(join(root, 'src/style.css'), '@import "./child.css";@master entry;@preserve native;')
    writeFileSync(join(root, 'src/child.css'), '.example{color:blue}')
    const result = await compile()
    const css = result.output.filter(o => o.type === 'asset' && o.fileName.endsWith('.css'))
    expect(css).toHaveLength(1)
    expect(css[0].fileName).toContain('master-css-inline-base-')
  })
})

test('BH-0004 a removed inline import does not publish plugin-owned assets', async () => {
  await fixture(async (root, compile) => {
    writeFileSync(join(root, 'src/main.js'), 'import css from "./style.css?inline"; window.alive = true')
    writeFileSync(join(root, 'src/style.css'), '@master entry;@preserve native;.example{color:blue;background:url(pixel.svg)}')
    writeFileSync(join(root, 'src/pixel.svg'), '<svg/>')
    const result = await compile()
    expect(result.output.filter(o => o.type === 'asset' && o.fileName !== 'index.html')).toEqual([])
  })
})

test('BH-0004 unused inline assets are removed without deleting another string URL base', async () => {
  await fixture(async (root, compile) => {
    writeFileSync(join(root, 'src/main.js'), 'import css from "./style.css?inline"; import unused from "./other.css?inline"; window.inlineCSS = css')
    writeFileSync(join(root, 'src/style.css'), '@master entry;@preserve native;.example{color:blue}')
    writeFileSync(join(root, 'src/other.css'), '@master entry;@preserve native;.other{background:url(pixel.svg)}')
    writeFileSync(join(root, 'src/pixel.svg'), '<svg/>')
    const result = await compile()
    const assets = result.output.filter(o => o.type === 'asset' && o.fileName !== 'index.html')
    expect(assets).toHaveLength(1)
    expect(assets[0].fileName).toContain('master-css-inline-base-')
  })
})
