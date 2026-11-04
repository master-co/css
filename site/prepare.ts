import './scripts/bundler-imports'
import { prepareTokenFamilies } from './scripts/prepare-token-families'
import { prepareBenchmarkData } from './scripts/prepare-benchmark-data'

await prepareTokenFamilies()
await prepareBenchmarkData()
// UI inventory follows the actual models; it contains no translated measurement data.
const { benchmarkContentComponents } = await import('./utils/benchmark-content')
const { benchmarkCopyKeys } = await import('@master/internal-site/benchmarks/localization.ts')
const { writeIfChanged } = await import('./scripts/write-if-changed')
await writeIfChanged(new URL('./.generated/benchmark-ui.json', import.meta.url), JSON.stringify([...new Set(Object.values(benchmarkContentComponents).flatMap(benchmarkCopyKeys))].sort()))
await import('./prepare-run')
