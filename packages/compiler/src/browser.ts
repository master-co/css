import init, { transform } from 'lightningcss-wasm'
import {
    compileCSS as compileCSSCore,
    parseDirectives as parseDirectivesCore,
    setCSSTransform,
    type CompileCSSOptions,
    type CompileCSSResult
} from './core'

export type * from './core'

let initPromise: Promise<void> | undefined

export async function initCSSCompiler(input?: Parameters<typeof init>[0]) {
    initPromise ??= init(input).then(() => {
        setCSSTransform(transform as any)
    })
    await initPromise
}

export async function compileCSS(source: string, options: CompileCSSOptions = {}): Promise<CompileCSSResult> {
    await initCSSCompiler()
    return compileCSSCore(source, options)
}

export async function parseDirectives(source: string, options: CompileCSSOptions = {}) {
    await initCSSCompiler()
    return parseDirectivesCore(source, options)
}
