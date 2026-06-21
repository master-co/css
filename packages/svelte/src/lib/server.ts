import { createHydrationManifest, type MasterCSS, type MasterCSSManifest } from '@master/css'
import { createServerCSS, parseHTML } from '@master/css-server'
import {
    createMasterCSSHydrationManifestScript,
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from 'shared/master-css-hydration-manifest'
import type { Handle } from '@sveltejs/kit'

const HEAD_CLOSE_TAG = '</head>'
const HEAD_CLOSE_TAIL_LENGTH = HEAD_CLOSE_TAG.length - 1
const MASTER_STYLE_PATTERN = /<style\b(?=[^>]*\bid=(["'])master\1)[^>]*>[\s\S]*?<\/style>/i
const MASTER_RUNTIME_MANIFEST_PATTERN = new RegExp(
    `<script\\b(?=[^>]*\\bid=(["'])${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}\\1)[^>]*>[\\s\\S]*?<\\/script>`,
    'i'
)

export interface MasterCSSSvelteHandleOptions {
    manifest: MasterCSSManifest
}

export interface MasterCSSChunkRenderer {
    css: MasterCSS
    transform(html: string, done?: boolean): string
}

function findHeadCloseIndex(html: string) {
    return html.toLowerCase().indexOf(HEAD_CLOSE_TAG)
}

function createMasterStyle(cssText: string) {
    return `<style id="master">${cssText}</style>`
}

function createMasterHydrationManifest(css: MasterCSS) {
    const hydrationManifest = createHydrationManifest(css)
    return hydrationManifest.rules.length ? createMasterCSSHydrationManifestScript(hydrationManifest) : ''
}

export function collectMasterCSSClasses(css: MasterCSS, html: string) {
    for (const className of parseHTML(html).classes) {
        css.add(className)
    }
}

function injectMasterHydrationManifest(html: string, scriptText: string) {
    if (!scriptText) return html
    if (MASTER_RUNTIME_MANIFEST_PATTERN.test(html)) {
        return html.replace(MASTER_RUNTIME_MANIFEST_PATTERN, () => scriptText)
    }
    const headCloseIndex = findHeadCloseIndex(html)
    if (headCloseIndex === -1) return html
    return html.slice(0, headCloseIndex) + scriptText + html.slice(headCloseIndex)
}

export function injectMasterStyle(html: string, cssText: string, manifestScriptText = '') {
    if (!cssText) return html
    const style = createMasterStyle(cssText)
    let nextHTML: string
    if (MASTER_STYLE_PATTERN.test(html)) {
        nextHTML = html.replace(MASTER_STYLE_PATTERN, () => style)
    } else {
        const headCloseIndex = findHeadCloseIndex(html)
        if (headCloseIndex === -1) return html
        nextHTML = html.slice(0, headCloseIndex) + style + html.slice(headCloseIndex)
    }
    return injectMasterHydrationManifest(nextHTML, manifestScriptText)
}

export function createMasterCSSChunkRenderer(manifest: MasterCSSManifest): MasterCSSChunkRenderer {
    const css = createServerCSS(manifest)
    let injected = false
    let carry = ''

    return {
        css,
        transform(html, done = false) {
            const nextHTML = carry + html
            carry = ''

            if (injected) return nextHTML

            collectMasterCSSClasses(css, nextHTML)

            const transformedHTML = injectMasterStyle(nextHTML, css.text, createMasterHydrationManifest(css))
            const hasHeadClose = findHeadCloseIndex(nextHTML) !== -1
            if (transformedHTML !== nextHTML || hasHeadClose) {
                injected = true
                return transformedHTML
            }

            if (done || nextHTML.length <= HEAD_CLOSE_TAIL_LENGTH) {
                return nextHTML
            }

            carry = nextHTML.slice(-HEAD_CLOSE_TAIL_LENGTH)
            return nextHTML.slice(0, -HEAD_CLOSE_TAIL_LENGTH)
        }
    }
}

export function createMasterCSSHandle(options: MasterCSSSvelteHandleOptions): Handle {
    return async ({ event, resolve }) => {
        const renderer = createMasterCSSChunkRenderer(options.manifest)
        return await resolve(event, {
            transformPageChunk: ({ html, done }) => renderer.transform(html, done)
        })
    }
}
