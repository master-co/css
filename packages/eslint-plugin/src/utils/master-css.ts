import { type MasterCSS, type MasterCSSManifest } from '@master/css'
import { createCSSWithNativeDeclarations } from '@master/css-validator'
import { createRequire } from 'node:module'

export type { MasterCSS, MasterCSSManifest }
const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest
export { createCSSWithNativeDeclarations, defaultManifest }
