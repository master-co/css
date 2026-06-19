import { createCSS, previewCSS, type MasterCSSPlan } from '@master/css'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import { compileCSSPlan, type CompileCSSPlanResult } from '@master/css-compiler/browser'
import { collectAnimationNamesFromDeclaration } from '@master/css-engine'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

export interface CompilePlayCSSResult {
    css: string
    plan: MasterCSSPlan
    warnings: string[]
    result: CompileCSSPlanResult
}

function collectCSSVariableReferences(source: string) {
    const references = new Set<string>()
    for (const match of source.matchAll(/var\(\s*--([_a-zA-Z0-9-]+)/g)) {
        references.add(match[1])
    }
    return references
}

function collectCSSKeyframeNames(source: string) {
    const names = new Set<string>()
    for (const match of source.matchAll(/@keyframes\s+(-?[_a-zA-Z][-_a-zA-Z0-9]*)/g)) {
        names.add(match[1])
    }
    return names
}

function collectCSSAnimationReferences(source: string, css: ReturnType<typeof createCSS>, ignoredAnimationNames = new Set<string>()) {
    const references = new Set<string>()
    const animationNames = Array.from(css.animations.keys())
    if (!animationNames.length) return references
    for (const match of source.matchAll(/\b(animation(?:-name)?)\s*:\s*([^;{}]+)/g)) {
        for (const name of collectAnimationNamesFromDeclaration(match[1], match[2], {
            animationNames,
            variables: css.variables,
            variableNames: collectCSSVariableReferences(match[2])
        })) {
            if (ignoredAnimationNames.has(name)) continue
            references.add(name)
        }
    }
    return references
}

function renderClassCSS(plan: MasterCSSPlan, classes: string[], nativeCSS: string) {
    const nativeAnimationNames = collectCSSKeyframeNames(nativeCSS)
    const css = createCSS(
        plan,
        nativeAnimationNames.size
            ? {
                animations: Object.fromEntries([...nativeAnimationNames].map((name) => [name, 1]))
            }
            : undefined
    )
    return previewCSS(css, classes, {
        variableNames: collectCSSVariableReferences(nativeCSS),
        animationNames: collectCSSAnimationReferences(nativeCSS, css, nativeAnimationNames)
    })
}

export async function compilePlayCSS(sourceCSS: string, classes: string[]): Promise<CompilePlayCSSResult> {
    const result = await compileCSSPlan(sourceCSS, {
        basePlan: defaultPlan,
        from: 'playground.css'
    })
    const nativeCSS = result.css || ''
    const generatedCSS = renderClassCSS(result.plan, classes, nativeCSS)
    const css = [
        nativeCSS,
        generatedCSS
    ].filter(Boolean).join('\n\n')
    return {
        css,
        plan: result.plan,
        warnings: result.warnings,
        result
    }
}
