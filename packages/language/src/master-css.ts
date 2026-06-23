import { MasterCSS, type CompiledUtility } from '@master/css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import UtilityType from '@master/css-schema/utility-type'
import type { ValueComponent, Variable } from '@master/css-schema/css-syntax'
import type { MasterCSSManifest, MasterCSSManifestAtRuleNode } from '@master/css-schema/manifest'
import { getMdnPropertySyntax } from './utils/mdn-css-data'

export type { CompiledUtility, ValueComponent, Variable }
const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
export { defaultManifest, MasterCSS, UtilityType }

export function matchesLanguageServiceNativeDeclaration({ property }: { property: string }) {
    return property.startsWith('--') || Boolean(getMdnPropertySyntax(property))
}

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
    nodes: MasterCSSManifestAtRuleNode[]
}

export function createDefaultCSS() {
    return MasterCSS.create({
        manifest: defaultManifest,
        nativeDeclarationMatcher: matchesLanguageServiceNativeDeclaration
    })
}

export function createLanguageCSS(manifest: MasterCSSManifest = defaultManifest) {
    return MasterCSS.create({
        manifest,
        nativeDeclarationMatcher: matchesLanguageServiceNativeDeclaration
    })
}

export function generateCSS(classNames: string[], css: MasterCSS = createDefaultCSS()) {
    const generatedCSS = MasterCSS.create({
        manifest: css.manifest,
        nativeDeclarationMatcher: matchesLanguageServiceNativeDeclaration
    })
    for (const className of classNames) {
        generatedCSS.add(className)
    }
    return generatedCSS.text
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

function findNumberNode(nodes: MasterCSSManifestAtRuleNode[]): Extract<MasterCSSManifestAtRuleNode, { type: 'number' }> | undefined {
    for (const node of nodes) {
        if (node.type === 'number') return node
        if ('children' in node) {
            const child = findNumberNode(node.children)
            if (child) return child
        }
    }
}

export function getSingleAtNumberRuleNode(nodes: MasterCSSManifestAtRuleNode[]) {
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
