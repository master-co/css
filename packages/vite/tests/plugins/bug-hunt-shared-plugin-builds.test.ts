import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

async function rootsFixture(run: (roots: string[]) => Promise<void>, qualified = true) {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const roots = ['first', 'second'].map(() => realpathSync(mkdtempSync(join(parent, 'shared-build-'))))
  try {
    for (const [index, root] of roots.entries()) {
      const color = ['#123456', '#abcdef'][index]
      writeFileSync(join(root, 'style.css'), `@import "./child.css" layer(shared);@master entry;@preserve native;@components{card{color:${color}}}.example{color:${color};background:url(pixel.svg)}`)
      writeFileSync(join(root, 'child.css'), (qualified ? '@import "https://external.test/style.css";' : '') + '.child{background:url(pixel.svg)}')
      writeFileSync(join(root, 'pixel.svg'), `<svg xmlns="http://www.w3.org/2000/svg"><title>root-${index}</title></svg>`)
      writeFileSync(join(root, 'index.html'), '<div class="example card"></div><script type="module" src="./client.js"></script>')
      writeFileSync(join(root, 'client.js'), 'import "./style.css";import css from "./style.css?inline";window.css=css')
      writeFileSync(join(root, 'server.js'), 'export {default as css} from "./style.css?inline"')
    }
    await run(roots)
  } finally { for (const root of roots) rmSync(root, { recursive: true, force: true }) }
}

async function settleBuilds<T>(jobs: Promise<T>[]): Promise<T[]> {
  const results = await Promise.allSettled(jobs)
  return results.map(result => { if (result.status === 'rejected') throw result.reason;return result.value })
}

function singleOutput(result: Awaited<ReturnType<typeof build>>) {
  if (Array.isArray(result) || 'on' in result) throw new Error('Expected one output bundle')
  return result.output
}

test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)('BH-0004 shared %s plugins isolate concurrent HTML builds and resources', async mode => {
  await rootsFixture(async roots => {
    const plugins = masterCSS({ mode })
    const outputs = await settleBuilds(roots.map((root, index) => build({ root, configFile: false, base: `/root-${index}/`, logLevel: 'silent', plugins: process.env.BH_INDEPENDENT === '1' ? masterCSS({ mode }) : plugins, build: { write: false, minify: false, cssMinify: false } }).then(singleOutput)))
    for (const [index, output] of outputs.entries()) {
      const assets = output.filter(item => item.type === 'asset')
      const css = assets.filter(item => item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n')
      expect(css).toContain(['#123456', '#abcdef'][index])
      expect(css).not.toContain(['#abcdef', '#123456'][index])
      const resources = assets.filter(item => item.fileName.endsWith('.svg'))
      expect(resources.length).toBeGreaterThan(0)
      expect(resources.every(item => String(item.source).includes(`root-${index}`))).toBe(true)
      const html = String(assets.find(item => item.fileName === 'index.html')!.source)
      expect(html).toContain(`/root-${index}/`)
      expect(html).not.toContain(`/root-${1 - index}/`)
      if (mode === 'pre-render' || mode === 'progressive') {
        expect(html).toContain(`.card{color:${['#123456', '#abcdef'][index]}}`)
        expect(html).not.toContain(['#abcdef', '#123456'][index])
        expect(assets.some(item => item.fileName.includes('master-css-hydration.'))).toBe(mode === 'progressive')
      }
      if (mode === 'runtime') expect(html).toContain('as="json"')
    }
  }, process.env.BH_QUALIFIED === '1')
})

for (const configFile of [false, true]) {
  test.each(['', './'])('BH-0004 shared SSR/client plugins preserve base=%s with config file ' + configFile, async base => {
    await rootsFixture(async roots => {
      const plugins = masterCSS({ mode: 'static', runtime: false })
      const outputs = await settleBuilds(roots.map(async (root, index) => {
        writeFileSync(join(root, 'client.js'), 'import css from "./style.css?inline";window.css=css')
        const configuredBase = index ? '/second/' : base
        if (configFile) writeFileSync(join(root, 'vite.config.mjs'), `export default {base:${JSON.stringify(configuredBase)}}`)
        return settleBuilds([false, true].map(ssr => build({
          root, configFile: configFile ? join(root, 'vite.config.mjs') : false, ...(configFile ? {} : { base: configuredBase }), logLevel: 'silent',
          plugins: [...plugins, { name: 'audit:post-config-merge', config: { order: 'post', handler() { return { define: { __AUDIT__: 'true' } } } } }],
          build: { write: false, ssr: ssr ? join(root, 'server.js') : false, ssrEmitAssets: true, minify: false, cssMinify: false, rolldownOptions: { input: ssr ? undefined : join(root, 'client.js') } }
        }).then(singleOutput)))
      }))
      for (const [index, pair] of outputs.entries()) {
        const retained = pair.map(output => new Map(output.flatMap(item => item.type === 'asset' && item.fileName.endsWith('.css') && String(item.source).includes('https://external.test/') ? [[item.fileName, String(item.source)] as const] : [])))
        expect(retained[0].size).toBeGreaterThan(0)
        // Automatic and inline delivery may each publish a copy; compare the inline graph.
        const inline = retained.map(assets => new Map([...assets].filter(([name]) => name.includes('master-css-inline-'))))
        expect(inline[0].size).toBeGreaterThan(0)
        expect(inline[1]).toEqual(inline[0])
        for (const css of inline[1].values()) {
          if (index) expect(css).toContain('/second/')
          else expect(css).not.toContain('url(/assets/')
        }
      }
    })
  })
}
