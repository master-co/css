import { createRequire } from 'node:module'
import type { MasterCSSManifest } from 'shared/master-css-manifest'

const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest

export default defaultManifest
