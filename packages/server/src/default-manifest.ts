import { createRequire } from 'node:module'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const require = createRequire(import.meta.url)
let defaultManifest: MasterCSSManifest | undefined

export default function getDefaultManifest() {
    defaultManifest ??= require('@master/css-preset/default-manifest.json') as MasterCSSManifest
    return defaultManifest
}
