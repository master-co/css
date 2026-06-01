const variableNamespaces = [
    'border-radius',
    'color',
    'color-line',
    'color-text',
    'duration',
    'easing',
    'font-family',
    'font-size',
    'font-style',
    'font-variant',
    'font-weight',
    'outline-color',
    'outline-offset',
    'outline-style',
    'outline-width',
    'shadow',
    'spacing',
] as const

export type VariableNamespace = typeof variableNamespaces[number]

export default variableNamespaces
