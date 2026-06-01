const variableNamespaces = [
    'animation',
    'aspect-ratio',
    'blur',
    'border-radius',
    'color',
    'color-line',
    'color-text',
    'drop-shadow',
    'duration',
    'easing',
    'font-family',
    'font-size',
    'font-style',
    'font-variant',
    'font-weight',
    'letter-spacing',
    'line-height',
    'outline-color',
    'outline-offset',
    'outline-style',
    'outline-width',
    'perspective',
    'screen',
    'shadow',
    'shadow-inset',
    'spacing',
    'tab-size',
    'zoom',
] as const

export type VariableNamespace = typeof variableNamespaces[number]

export default variableNamespaces
