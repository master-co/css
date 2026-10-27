import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { installScannedSourceCounter } from '../shared/scanned-sources.mjs'
import { instrumentMasterVitePlugins } from '../shared/vite-diagnostic-instrumentation.mjs'

const normalize = (cwd: string, source: string) => resolve(cwd, source.split('?')[0])

test('source observations count successful work even when classes do not change, deduplicating files', async () => {
  class Scanner {
    constructor(public cwd = '/work') { }
    async scan(source: string, _content: string) {
      if (source === 'failure.js') throw new Error('scan failed')
      return false
    }
  }
  const descriptor = Object.getOwnPropertyDescriptor(Scanner.prototype, 'scan')
  const counter = installScannedSourceCounter(Scanner.prototype, '/work', normalize)
  try {
    const scanner = new Scanner()
    for (const name of ['a.js', '/work/a.js?one', 'a.js?two', 'b.html', '\0virtual.js']) {
      expect(await scanner.scan(name, 'nonempty')).toBe(false)
    }
    await scanner.scan('empty.js', '')
    await new Scanner('/elsewhere').scan('other.js', 'nonempty')
    await expect(scanner.scan('failure.js', 'nonempty')).rejects.toThrow('scan failed')
    expect([...counter.files].sort()).toEqual(['/work/a.js', '/work/b.html'])
    expect(() => installScannedSourceCounter(Scanner.prototype, '/work', normalize)).toThrow('isolated diagnostic builds')
  } finally { counter.restore(); counter.restore() }
  expect(Object.getOwnPropertyDescriptor(Scanner.prototype, 'scan')).toEqual(descriptor)
})

test('instrumentation keeps the factory object used by environment closures and preserves hook metadata', async () => {
  const seen: unknown[] = []
  const receiver = { id: 'environment' }
  const failure = new Error('hook failed')
  const plugin = {
    name: 'master-css:usage-graph',
    async transform(this: unknown, ...args: unknown[]) { seen.push({ receiver: this, args }); return 'transformed' },
    transformIndexHtml: { order: 'pre', filter: { id: /html$/ }, async handler() { throw failure } },
    applyToEnvironment() { return { transform: plugin.transform, transformIndexHtml: plugin.transformIndexHtml } }
  }
  const timings: string[] = []
  const plugins = [plugin]
  expect(instrumentMasterVitePlugins(plugins, async (id, callback) => { timings.push(id); return callback() })).toBe(plugins)
  const bound = plugin.applyToEnvironment()
  expect(await bound.transform.call(receiver, 'code', 'file.js')).toBe('transformed')
  expect(seen).toEqual([{ receiver, args: ['code', 'file.js'] }])
  await expect(bound.transformIndexHtml.handler()).rejects.toBe(failure)
  expect(bound.transformIndexHtml.order).toBe('pre')
  expect(bound.transformIndexHtml.filter.id).toEqual(/html$/)
  expect(timings).toEqual(['vite-master-module-scan-ms', 'vite-master-html-scan-ms'])
})

test('both helpers load in the same plain Node process used by startup probes', () => {
  const result = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { installScannedSourceCounter } from ${JSON.stringify(new URL('../shared/scanned-sources.mjs', import.meta.url).href)};
    import { instrumentMasterVitePlugins } from ${JSON.stringify(new URL('../shared/vite-diagnostic-instrumentation.mjs', import.meta.url).href)};
    class Scanner { async scan() { return false; } }
    const counter = installScannedSourceCounter(Scanner.prototype, '/work', (cwd, source) => source ? cwd + '/' + source : cwd);
    const scanner = new Scanner();scanner.cwd='/work';
    await scanner.scan('a.js', 'content');counter.restore();
    const times=[];
    const plugins=instrumentMasterVitePlugins([{name:'master-css:style-entry',load(){return 'css';}}],async (id,work)=>{times.push(id);return work();});
    console.log(JSON.stringify({files:[...counter.files],loaded:await plugins[0].load(),times}));
  `], { encoding: 'utf8' })
  expect(JSON.parse(result)).toEqual({ files: ['/work/a.js'], loaded: 'css', times: ['vite-master-style-entry-ms'] })
})
