import init, { transform } from 'lightningcss-wasm'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import {
    compileCSS as compileCSSCore,
    parseDirectives as parseDirectivesCore,
    setCSSTransform,
    type CompileCSSOptions,
    type CompileCSSResult
} from './core'
import lowerCSSDirectives from './lower-css-directives'

export type * from './core'

export type CompileCSSPlanSourceOptions = CompileCSSOptions & {
    basePlan?: MasterCSSPlan
}

export interface CompileCSSPlanResult extends Omit<CompileCSSResult, 'planInput'> {
    plan: MasterCSSPlan
    directives: CompileCSSResult
}

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

export async function compileCSSPlan(source: string, options: CompileCSSPlanSourceOptions = {}): Promise<CompileCSSPlanResult> {
    const result = await compileCSS(source, options)
    if (result.references?.length) {
        throw new Error('Browser compileCSSPlan cannot resolve @reference directives. Inline referenced CSS or compile the stylesheet in a Node environment.')
    }

    const { planInput: _planInput, ...directiveData } = result
    const lowerResult = lowerCSSDirectives(result, {
        basePlan: options.basePlan,
        onWarning: options.onWarning
    })
    const generatedCSS = lowerResult.generatedCSS || ''
    const css = [
        result.nativeCSS,
        generatedCSS
    ].filter(Boolean).join('\n')

    return {
        ...directiveData,
        dependencies: [],
        plan: lowerResult.plan,
        warnings: lowerResult.warnings,
        generatedCSS,
        css,
        directives: result
    }
}

export async function parseDirectives(source: string, options: CompileCSSOptions = {}) {
    await initCSSCompiler()
    return parseDirectivesCore(source, options)
}
