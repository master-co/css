import { expect, test, vi } from 'vitest'
import ScannerPlugin from '../../src/plugins/scanner'
import UsageGraphPlugin from '../../src/plugins/usage-graph'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn(async (file: string) => `authored ${file}`) }))

vi.mock('@master/css-tooling/scanner/node', () => ({
  MasterCSSScanner: class {
    options: any = {}
    scans: [string, string][] = []
    sourcePolicyDependencies = []
    isModuleAllowed() { return true }
    removeSource() {}
    async init() { return this }
    async scanModule(id: string, code: string) { this.scans.push([id, code]); return true }
    async dispose() {}
  }
}))

test('scans authored Astro components rather than their compiled modules', async () => {
  const context: any = {}
  const scanner = ScannerPlugin({} as any, context) as any
  const usageGraph = UsageGraphPlugin({} as any, context) as any
  await scanner.configResolved.call({}, { root: '/proj' })

  await usageGraph.transform.call({}, 'import { render as $$render } from "astro/compiler-runtime"', '/proj/src/pages/index.astro')
  await usageGraph.transform.call({}, 'const value = 1', '/proj/src/pages/index.astro?astro&type=script&index=0&lang.ts')

  expect(context.scanner.scans).toEqual([['/proj/src/pages/index.astro', 'authored /proj/src/pages/index.astro']])
})
