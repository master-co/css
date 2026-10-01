import './scripts/ignore-css-imports'
import { prepareTokenFamilies } from './scripts/prepare-token-families'

await prepareTokenFamilies()
await import('./prepare-run')
