import { createCSS, defaultPlan, type CompiledUtility, type MasterCSS } from '@master/css'
import UtilityType from 'shared/utility-type'
import type { ValueComponent, Variable } from 'shared/css-syntax'
import type { MasterCSSPlanAtRuleNode } from 'shared/master-css-plan'

export type { CompiledUtility, MasterCSS, ValueComponent, Variable }
export { createCSS, defaultPlan, UtilityType }

export const SELECTOR_SIGNS = [':', '_', '>', '+', '~']
export const QUERY_COMPARISON_OPERATORS = ['>', '<', '=']
export const QUERY_LOGICAL_OPERATORS = ['&']
export const DELIMITER_SIGN = '|'
export const SEPARATOR_SIGN = ','
export const AT_SIGN = '@'
export const CLASS_ATTRIBUTES = ['class', 'className']
export const CLASS_DECLARATIONS: string[] = []
export const CLASS_FUNCTIONS = ['clsx', 'cva', 'ctl', 'cv', 'class', 'classnames', 'classVariant', 'styled(?:\\s+)?(?:\\.\\w+)?', 'classList(?:\\s+)?\\.(?:add|remove|toggle|replace)']

export interface AtRule {
    id: string
    nodes: MasterCSSPlanAtRuleNode[]
}

export function createDefaultCSS() {
    return createCSS(defaultPlan)
}

export function generateCSS(classNames: string[], css: MasterCSS = createDefaultCSS()) {
    const previewCSS = createCSS(css.plan)
    for (const className of classNames) {
        previewCSS.add(className)
    }
    return previewCSS.text
}

export function isCoreRule(id: string) {
    return id
}

export function getStaticUtilityDeclarations(utility: CompiledUtility) {
    const emit = utility.emit
    if (emit.type === 'static') {
        return emit.rules[0]?.declarations
    }
    if (emit.type === 'template') {
        return emit.declarations
    }
}

function findNumberNode(nodes: MasterCSSPlanAtRuleNode[]): Extract<MasterCSSPlanAtRuleNode, { type: 'number' }> | undefined {
    for (const node of nodes) {
        if (node.type === 'number') return node
        if ('children' in node) {
            const child = findNumberNode(node.children)
            if (child) return child
        }
    }
}

export function getSingleAtNumberRuleNode(nodes: MasterCSSPlanAtRuleNode[]) {
    return findNumberNode(nodes)
}

export function parseAt(token: string, css: MasterCSS = createDefaultCSS()): AtRule {
    const alias = token.replace(/^[<>=&@]+/, '')
    return css.atRules.get(alias) || { id: 'media', nodes: [] }
}

export function generateAt(atRule: AtRule) {
    const body = atRule.nodes
        .map((node) => node.raw || ('value' in node ? String(node.value) : 'name' in node ? node.name : ''))
        .filter(Boolean)
        .join(' ')
    return `@${atRule.id}${body ? ` ${body}` : ''}`
}
