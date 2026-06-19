export const builtinNamespaces = Object.freeze([
    'animation',
    'breakpoint',
    'color',
    'color-line',
    'color-text',
    'container',
    'content',
    'duration',
    'easing',
    'font',
    'font-family',
    'font-feature',
    'font-size',
    'font-weight',
    'leading',
    'order',
    'radius',
    'shadow',
    'spacing',
    'tracking'
] as const)

export type MasterCSSBuiltinNamespace = typeof builtinNamespaces[number]
export type MasterCSSBuiltinNamespaceRef = `~${MasterCSSBuiltinNamespace}` | `=${MasterCSSBuiltinNamespace}`

export function builtinNamespaceRef(namespace: MasterCSSBuiltinNamespace, exact = false): MasterCSSBuiltinNamespaceRef {
    return `${exact ? '=' : '~'}${namespace}` as MasterCSSBuiltinNamespaceRef
}

export const builtinNamespaceSet: ReadonlySet<string> = new Set<string>(builtinNamespaces)
