export const namespaces = [
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
] as const

export type PresetNamespace = typeof namespaces[number]
export type PresetNamespaceRef = `~${PresetNamespace}` | `=${PresetNamespace}`

export function namespaceRef(namespace: PresetNamespace, exact = false): PresetNamespaceRef {
    return `${exact ? '=' : '~'}${namespace}` as PresetNamespaceRef
}

export const namespaceSet = new Set<string>(namespaces)
