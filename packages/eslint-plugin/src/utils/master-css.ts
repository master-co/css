import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createRequire } from 'node:module'

export type { MasterCSSManifest }
const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest
export { defaultManifest }
