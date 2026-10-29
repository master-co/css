import './scripts/bundler-imports'
import { prepareTokenFamilies } from './scripts/prepare-token-families'
import { prepareBenchmarkData } from './scripts/prepare-benchmark-data'

await prepareTokenFamilies()
await prepareBenchmarkData()
await import('./prepare-run')
