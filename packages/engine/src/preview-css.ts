import AnimationRule from './animation-rule'
import type MasterCSS from './core'
import type { Rule } from './rule'
import { getThemeLayerText } from './theme-layer'
import { Utility } from './utility'
import { findUtilityInsertIndex } from './utility-layer'
import VariableRule from './variable-rule'
import type { MasterCSSPlanUtilityLayerName } from 'shared/master-css-plan'

type PreviewUtilityRule = Utility | Rule

interface PreviewState {
    variableRules: VariableRule[]
    variables: Map<string, VariableRule>
    animations: Map<string, AnimationRule>
    animationRules: AnimationRule[]
    utilityRules: Record<MasterCSSPlanUtilityLayerName, PreviewUtilityRule[]>
    utilityKeys: Record<MasterCSSPlanUtilityLayerName, Set<string>>
    classNames: Set<string>
}

const utilityLayerNames: MasterCSSPlanUtilityLayerName[] = ['base', 'defaults', 'components', 'utilities']

function createUtilityRuleRecord<T>(createValue: () => T): Record<MasterCSSPlanUtilityLayerName, T> {
    return {
        base: createValue(),
        defaults: createValue(),
        components: createValue(),
        utilities: createValue()
    }
}

function createPreviewState(): PreviewState {
    return {
        variableRules: [],
        variables: new Map(),
        animations: new Map(),
        animationRules: [],
        utilityRules: createUtilityRuleRecord(() => []),
        utilityKeys: createUtilityRuleRecord(() => new Set()),
        classNames: new Set()
    }
}

function insertVariable(css: MasterCSS, state: PreviewState, name: string, visited = new Set<string>()) {
    if (visited.has(name)) return
    visited.add(name)
    const variable = css.variables.get(name)
    if (!variable || variable.inline) return

    if (!state.variables.has(name) && !css.isPreloadedVariable(name)) {
        const rule = new VariableRule(name, variable, css)
        state.variables.set(name, rule)
        state.variableRules.push(rule)
    }

    variable.dependencies?.forEach((dependency) => insertVariable(css, state, dependency, visited))
}

function insertVariables(css: MasterCSS, state: PreviewState, rule: PreviewUtilityRule | AnimationRule) {
    if (!('variableNames' in rule)) return
    rule.variableNames?.forEach((variableName) => insertVariable(css, state, variableName))
}

function insertAnimation(css: MasterCSS, state: PreviewState, name: string, staticReference = false) {
    let rule = state.animations.get(name)
    if (!rule) {
        const keyframes = css.animations.get(name)
        if (!keyframes) return
        rule = new AnimationRule(name, keyframes, css)
        state.animations.set(name, rule)
        if (!css.isPreloadedAnimation(name)) {
            state.animationRules.push(rule)
        }
    }

    if (staticReference || !css.isPreloadedAnimation(name)) {
        insertVariables(css, state, rule)
    }
}

function insertAnimations(css: MasterCSS, state: PreviewState, rule: PreviewUtilityRule) {
    if (!('animationNames' in rule)) return
    rule.animationNames?.forEach((animationName) => insertAnimation(css, state, animationName))
}

function insertStaticResources(css: MasterCSS, state: PreviewState) {
    for (const [name, variable] of css.variables) {
        if (variable.static) insertVariable(css, state, name)
    }
    for (const name of css.animations.keys()) {
        if (css.plan.animationOptions?.[name]?.static) insertAnimation(css, state, name, true)
    }
}

function insertUtilityRule(css: MasterCSS, state: PreviewState, rule: PreviewUtilityRule) {
    if ('valid' in rule && !rule.valid) return
    const layerName = rule instanceof Utility ? rule.layerName : 'utilities'
    const keys = state.utilityKeys[layerName]
    if (keys.has(rule.key)) return

    const rules = state.utilityRules[layerName]
    const index = rule instanceof Utility
        ? findUtilityInsertIndex(rules, rule)
        : rules.length
    rules.splice(index, 0, rule)
    keys.add(rule.key)
    insertVariables(css, state, rule)
    insertAnimations(css, state, rule)
}

function getUtilityLayerText(name: MasterCSSPlanUtilityLayerName, rules: PreviewUtilityRule[]) {
    const ruleText = rules.map(({ text }) => text).join('')
    if (!ruleText) return ''
    return '@layer ' + name + '{' + ruleText + '}'
}

function renderPreviewCSS(state: PreviewState) {
    return [
        getThemeLayerText('theme', state.variableRules),
        ...utilityLayerNames.map((layerName) => getUtilityLayerText(layerName, state.utilityRules[layerName])),
        state.animationRules.map(({ text }) => text).join('')
    ].join('')
}

export default function previewCSS(css: MasterCSS, classNames: readonly string[]) {
    const state = createPreviewState()
    insertStaticResources(css, state)

    for (const className of classNames) {
        if (state.classNames.has(className)) continue
        state.classNames.add(className)
        const rules = css.generate(className)
        if (rules.length) {
            rules.forEach((rule) => insertUtilityRule(css, state, rule))
        }
    }

    return renderPreviewCSS(state)
}
