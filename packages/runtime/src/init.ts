import CSSRuntime from './core'
import type { MasterCSSManifest } from 'shared/master-css-manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-engine'
import {
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
    type MasterCSSHydrationManifest
} from 'shared/master-css-hydration-manifest'

export interface CSSRuntimeInitOptions {
    manifest: MasterCSSManifest
    root?: Document | ShadowRoot
    autoObserve?: boolean
    emittedGlobals?: MasterCSSEmittedGlobals
    hydrationManifest?: MasterCSSHydrationManifest
}

function readHydrationManifest(root: Document | ShadowRoot): MasterCSSHydrationManifest | undefined {
    const DocumentConstructor = globalThis.Document
    const element = DocumentConstructor && root instanceof DocumentConstructor
        ? root.getElementById(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
        : 'querySelector' in root
            ? root.querySelector(`#${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}`)
            : undefined
    const source = element?.textContent?.trim()
    if (!source) return
    try {
        const hydrationManifest = JSON.parse(source) as MasterCSSHydrationManifest
        return hydrationManifest?.version === 1 && Array.isArray(hydrationManifest.rules)
            ? hydrationManifest
            : undefined
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.debug('Cannot parse Master CSS hydration manifest.', error)
        }
    }
}

/**
 * Initialize a new CSSRuntime instance and observe the target root
 * @param options runtime options
 * @returns master css instance
 */
export default function initCSSRuntime(options: CSSRuntimeInitOptions): CSSRuntime {
    const {
        manifest,
        root = document,
        autoObserve = true,
        emittedGlobals,
        hydrationManifest
    } = options
    let cssRuntime = globalThis.MasterCSSRuntime.instances.get(root)
    if (cssRuntime) {
        cssRuntime.registerEmittedGlobals(emittedGlobals)
        if (hydrationManifest) cssRuntime.hydrationManifest = hydrationManifest
        return cssRuntime
    }
    cssRuntime = new CSSRuntime(root, manifest, emittedGlobals, hydrationManifest || readHydrationManifest(root))
    if (autoObserve) cssRuntime.observe()
    return cssRuntime
}
