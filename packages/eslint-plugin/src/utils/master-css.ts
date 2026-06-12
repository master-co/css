import { createCSS, defaultPlan, type MasterCSS, type MasterCSSPlan } from '@master/css'

export type { MasterCSS, MasterCSSPlan }
export { createCSS, defaultPlan }

export const CLASS_ATTRIBUTES = ['class', 'className']
export const CLASS_DECLARATIONS: string[] = []
export const CLASS_FUNCTIONS = ['clsx', 'cva', 'ctl', 'cv', 'class', 'classnames', 'classVariant', 'styled(?:\\s+)?(?:\\.\\w+)?', 'classList(?:\\s+)?\\.(?:add|remove|toggle|replace)']

function stable(value: unknown): string {
    if (!value || typeof value !== 'object') return JSON.stringify(value)
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
    return `{${Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
        .join(',')}}`
}

export function equalDeclarations(a: unknown, b: unknown) {
    return stable(a) === stable(b)
}

export function equalVariants(a: { selectorText?: string, atRules?: unknown, layerName?: string }, b: { selectorText?: string, atRules?: unknown, layerName?: string }) {
    return a.selectorText === b.selectorText
        && a.layerName === b.layerName
        && stable(a.atRules) === stable(b.atRules)
}

export function sortReadableClasses(classNames: string[], css: MasterCSS) {
    return [...classNames].sort((a, b) => {
        const ruleA = css.generate(a)[0]
        const ruleB = css.generate(b)[0]
        if (!ruleA && !ruleB) return a.localeCompare(b)
        if (!ruleA) return 1
        if (!ruleB) return -1
        return Number(ruleA.priority) - Number(ruleB.priority) || a.localeCompare(b)
    })
}
