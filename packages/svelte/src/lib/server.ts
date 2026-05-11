import { createCSS, type MasterCSS } from '@master/css'
import { parseHTML } from '@master/css-server'
import type { Handle } from '@sveltejs/kit'

type CSSConfig = Parameters<typeof createCSS>[0]

const HEAD_CLOSE_TAG = '</head>'
const HEAD_CLOSE_TAIL_LENGTH = HEAD_CLOSE_TAG.length - 1
const MASTER_STYLE_PATTERN = /<style\b(?=[^>]*\bid=(["'])master\1)[^>]*>[\s\S]*?<\/style>/i

export interface MasterCSSSvelteHandleOptions {
    config?: CSSConfig
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

export function collectMasterCSSClasses(css: MasterCSS, html: string) {
    for (const className of parseHTML(html).classes) {
        css.add(className)
    }
}

export function injectMasterStyle(html: string, cssText: string) {
    if (!cssText) return html
    const style = createMasterStyle(cssText)
    if (MASTER_STYLE_PATTERN.test(html)) {
        return html.replace(MASTER_STYLE_PATTERN, () => style)
    }
    const headCloseIndex = findHeadCloseIndex(html)
    if (headCloseIndex === -1) return html
    return html.slice(0, headCloseIndex) + style + html.slice(headCloseIndex)
}

export function createMasterCSSChunkRenderer(config?: CSSConfig): MasterCSSChunkRenderer {
    const css = createCSS(config)
    let injected = false
    let carry = ''

    return {
        css,
        transform(html, done = false) {
            const nextHTML = carry + html
            carry = ''

            if (injected) return nextHTML

            collectMasterCSSClasses(css, nextHTML)

            const transformedHTML = injectMasterStyle(nextHTML, css.text)
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

export function createMasterCSSHandle(options: MasterCSSSvelteHandleOptions = {}): Handle {
    return async ({ event, resolve }) => {
        const renderer = createMasterCSSChunkRenderer(options.config)
        return await resolve(event, {
            transformPageChunk: ({ html, done }) => renderer.transform(html, done)
        })
    }
}
