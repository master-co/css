import CSSRuntime from './core'
import type { MasterCSSManifest } from 'shared/master-css-manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-engine'
import {
    MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
    type MasterCSSHydrationManifest
} from 'shared/master-css-hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from 'shared/master-css-runtime-style'

export interface CSSRuntimeInitOptions {
    manifest: MasterCSSManifest
    root?: Document | ShadowRoot
    autoObserve?: boolean
    emittedGlobals?: MasterCSSEmittedGlobals
    hydrationManifest?: MasterCSSHydrationManifest
}

function readHydrationManifest(root: Document | ShadowRoot): MasterCSSHydrationManifest | undefined {
    return readInlineHydrationManifest(root)
}

function findElementById(root: Document | ShadowRoot, id: string) {
    const DocumentConstructor = globalThis.Document
    return DocumentConstructor && root instanceof DocumentConstructor
        ? root.getElementById(id)
        : 'querySelector' in root
            ? root.querySelector(`#${id}`)
            : undefined
}

function readInlineHydrationManifest(root: Document | ShadowRoot): MasterCSSHydrationManifest | undefined {
    const element = findElementById(root, MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
    const source = element?.textContent?.trim()
    if (!source) return
    return parseHydrationManifest(source)
}

function parseHydrationManifest(source: string): MasterCSSHydrationManifest | undefined {
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

function readExternalHydrationManifestSource(root: Document | ShadowRoot) {
    const styleElement = findElementById(root, MASTER_CSS_RUNTIME_STYLE_ID)
    const HTMLStyleElementConstructor = globalThis.HTMLStyleElement
    return HTMLStyleElementConstructor && styleElement instanceof HTMLStyleElementConstructor
        ? styleElement.getAttribute(MASTER_CSS_HYDRATION_MANIFEST_ATTR)
        : undefined
}

export async function loadCSSRuntimeHydrationManifest(
    root: Document | ShadowRoot = document
): Promise<MasterCSSHydrationManifest | undefined> {
    const inlineHydrationManifest = readInlineHydrationManifest(root)
    if (inlineHydrationManifest) return inlineHydrationManifest

    const source = readExternalHydrationManifestSource(root)
    if (!source) return

    try {
        const response = await fetch(source, { credentials: 'same-origin' })
        if (!response.ok) return
        return parseHydrationManifest(await response.text())
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.debug('Cannot load Master CSS hydration manifest.', error)
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

export async function initCSSRuntimeAsync(options: CSSRuntimeInitOptions): Promise<CSSRuntime> {
    const root = options.root || document
    const hydrationManifest = options.hydrationManifest !== undefined
        ? options.hydrationManifest
        : await loadCSSRuntimeHydrationManifest(root)
    return initCSSRuntime({
        ...options,
        root,
        hydrationManifest
    })
}
