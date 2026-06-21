import type { MasterCSSEmittedGlobals } from './emitted-globals'
import MasterCSS, { type MasterCSSOptions } from './core'
import type { MasterCSSManifest } from 'shared/master-css-manifest'

export default function createCSS(
    manifest: MasterCSSManifest,
    emittedGlobals?: MasterCSSEmittedGlobals,
    options?: MasterCSSOptions
) {
    return new MasterCSS(manifest, emittedGlobals, options)
}
