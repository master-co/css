import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeIfChanged } from './write-if-changed'

const siteRoot = fileURLToPath(new URL('..', import.meta.url))
export const benchmarkSuites = ['docs-page-css-size', 'tailwind-static-comparison', 'build-path-diagnostics', 'browser-css-cost', 'master-delivery-modes', 'interaction-cost', 'browser-lifecycle', 'long-session-evidence'] as const
type BenchmarkSuite = typeof benchmarkSuites[number]
type Data = Record<string, any>
const pick = (source: Data, keys: string[]): Data => Object.fromEntries(keys.map(key => [key, source[key]]))

/** Display aggregates only: raw measurements remain in the committed benchmark reports. */
export function projectBenchmarkSnapshot(suite: BenchmarkSuite, source: Data): Data {
  switch (suite) {
    case 'docs-page-css-size':
      return { generatedAt: source.generatedAt, pages: source.pages.map((page: Data) => ({
        name: page.name, css: { total: page.css.total },
        assets: page.assets.map((asset: Data) => pick(asset, ['kind', 'tag', 'rawBytes', 'brotliBytes']))
      })) }
    case 'tailwind-static-comparison':
      return pick(source, ['fixtures', 'variants', 'results'])
    case 'build-path-diagnostics':
      return pick(source, ['fixtures', 'results', 'sourceReports', 'environment'])
    case 'browser-css-cost':
      return pick(source, ['browser', 'cssVolume', 'domScaling'])
    case 'master-delivery-modes':
      return pick(source, ['browser', 'fixtures', 'modes', 'results'])
    case 'interaction-cost':
      return { ...pick(source, ['browser', 'fixtures', 'modes', 'scenarios', 'results']), variantCount: source.variants.length }
    case 'browser-lifecycle':
      return { browser: source.browser, variantCount: source.variants.length, scenarioCount: source.scenarios.length, modeCount: source.modes.length }
    case 'long-session-evidence':
      return pick(source, ['browser', 'modes', 'variantSummaries'])
  }
}

export async function readBenchmarkSnapshots(root = siteRoot): Promise<Record<BenchmarkSuite, Data>> {
  return Object.fromEntries(await Promise.all(benchmarkSuites.map(async suite => {
    const file = suite === 'long-session-evidence' ? 'browser-lifecycle/long-session-evidence.json' : `${suite}/snapshot.json`
    return [suite, JSON.parse(await readFile(path.join(root, '../benchmarks', file), 'utf8'))]
  }))) as Record<BenchmarkSuite, Data>
}

export async function prepareBenchmarkData(root = siteRoot) {
  const directory = path.join(root, '.generated/benchmarks')
  await mkdir(directory, { recursive: true })
  const snapshots = await readBenchmarkSnapshots(root)
  const sources: Record<string, { generatedAt: string, href: string }> = {}
  for (const suite of benchmarkSuites) {
    const source = snapshots[suite]
    await writeIfChanged(path.join(directory, `${suite}.json`), JSON.stringify(projectBenchmarkSnapshot(suite, source)))
    const file = suite === 'long-session-evidence' ? 'browser-lifecycle/long-session-evidence.json' : `${suite}/snapshot.json`
    sources[suite] = { generatedAt: source.generatedAt, href: `https://github.com/master-co/css/blob/rc/benchmarks/${file}` }
  }
  await writeIfChanged(path.join(directory, 'sources.json'), JSON.stringify(sources))
}
