import CSSRuntime from './core'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import type { MasterCSSPreloaded } from '@master/css-engine'
import {
    MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID,
    type MasterCSSRuntimeManifest
} from 'shared/master-css-runtime-manifest'

export interface CSSRuntimeInitOptions {
    plan: MasterCSSPlan
    root?: Document | ShadowRoot
    autoObserve?: boolean
    preloaded?: MasterCSSPreloaded
    manifest?: MasterCSSRuntimeManifest
}

function readRuntimeManifest(root: Document | ShadowRoot): MasterCSSRuntimeManifest | undefined {
    const DocumentConstructor = globalThis.Document
    const element = DocumentConstructor && root instanceof DocumentConstructor
        ? root.getElementById(MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID)
        : 'querySelector' in root
            ? root.querySelector(`#${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}`)
            : undefined
    const source = element?.textContent?.trim()
    if (!source) return
    try {
        const manifest = JSON.parse(source) as MasterCSSRuntimeManifest
        return manifest?.version === 1 && Array.isArray(manifest.rules)
            ? manifest
            : undefined
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.debug('Cannot parse Master CSS runtime manifest.', error)
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
        plan,
        root = document,
        autoObserve = true,
        preloaded,
        manifest
    } = options
    let cssRuntime = globalThis.CSSRuntime.instances.get(root)
    if (cssRuntime) {
        cssRuntime.registerPreloaded(preloaded)
        if (manifest) cssRuntime.manifest = manifest
        return cssRuntime
    }
    cssRuntime = new CSSRuntime(root, plan, preloaded, manifest || readRuntimeManifest(root))
    if (autoObserve) cssRuntime.observe()
    return cssRuntime
}
