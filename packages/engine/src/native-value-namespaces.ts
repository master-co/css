import { builtinNamespaceRef, type MasterCSSBuiltinNamespaceRef } from './namespaces'

export interface MasterCSSBuiltinNativeValueNamespace {
    readonly properties: readonly string[]
    readonly variableAliasRefs: readonly MasterCSSBuiltinNamespaceRef[]
}

export type MasterCSSBuiltinNativeValueNamespaces = readonly MasterCSSBuiltinNativeValueNamespace[]

function freezeNamespace<T extends MasterCSSBuiltinNativeValueNamespace>(namespace: T): T {
    Object.freeze(namespace.properties)
    Object.freeze(namespace.variableAliasRefs)
    return Object.freeze(namespace)
}

const spacingProperties = Object.freeze([
    'background-position',
    'bottom',
    'border-spacing',
    'column-gap',
    'gap',
    'inset',
    'inset-block',
    'inset-block-end',
    'inset-block-start',
    'inset-inline',
    'inset-inline-end',
    'inset-inline-start',
    'left',
    'margin',
    'margin-block',
    'margin-block-end',
    'margin-block-start',
    'margin-bottom',
    'margin-inline',
    'margin-inline-end',
    'margin-inline-start',
    'margin-left',
    'margin-right',
    'margin-top',
    'mask-position',
    'object-position',
    'outline-offset',
    'padding',
    'padding-block',
    'padding-block-end',
    'padding-block-start',
    'padding-bottom',
    'padding-inline',
    'padding-inline-end',
    'padding-inline-start',
    'padding-left',
    'padding-right',
    'padding-top',
    'perspective',
    'perspective-origin',
    'right',
    'row-gap',
    'scroll-margin',
    'scroll-margin-block',
    'scroll-margin-block-end',
    'scroll-margin-block-start',
    'scroll-margin-bottom',
    'scroll-margin-inline',
    'scroll-margin-inline-end',
    'scroll-margin-inline-start',
    'scroll-margin-left',
    'scroll-margin-right',
    'scroll-margin-top',
    'scroll-padding',
    'scroll-padding-block',
    'scroll-padding-block-end',
    'scroll-padding-block-start',
    'scroll-padding-bottom',
    'scroll-padding-inline',
    'scroll-padding-inline-end',
    'scroll-padding-inline-start',
    'scroll-padding-left',
    'scroll-padding-right',
    'scroll-padding-top',
    'shape-margin',
    'text-indent',
    'text-underline-offset',
    'top',
    'translate',
    'transform-origin',
    'word-spacing'
] as const)

const spacingUnitlessProperties = Object.freeze([
    'cx',
    'cy',
    'stroke-dashoffset',
    'x',
    'y'
] as const)

const containerProperties = Object.freeze([
    'background-size',
    'block-size',
    'contain-intrinsic-block-size',
    'contain-intrinsic-inline-size',
    'flex-basis',
    'height',
    'inline-size',
    'max-block-size',
    'max-height',
    'max-inline-size',
    'max-width',
    'min-block-size',
    'min-height',
    'min-inline-size',
    'min-width',
    'mask-size',
    'width'
] as const)

const radiusProperties = Object.freeze([
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-end-end-radius',
    'border-end-start-radius',
    'border-radius',
    'border-start-end-radius',
    'border-start-start-radius',
    'border-top-left-radius',
    'border-top-right-radius'
] as const)

const borderColorProperties = Object.freeze([
    'border',
    'border-block',
    'border-block-color',
    'border-block-end',
    'border-block-end-color',
    'border-block-start',
    'border-block-start-color',
    'border-bottom',
    'border-bottom-color',
    'border-color',
    'border-inline',
    'border-inline-color',
    'border-inline-end',
    'border-inline-end-color',
    'border-inline-start',
    'border-inline-start-color',
    'border-left',
    'border-left-color',
    'border-right',
    'border-right-color',
    'border-top',
    'border-top-color',
    'outline',
    'outline-color'
] as const)

const nativeValueNamespaces: MasterCSSBuiltinNativeValueNamespaces = Object.freeze([
    freezeNamespace({
        properties: spacingProperties,
        variableAliasRefs: [builtinNamespaceRef('spacing')]
    }),
    freezeNamespace({
        properties: spacingUnitlessProperties,
        variableAliasRefs: [builtinNamespaceRef('spacing')]
    }),
    freezeNamespace({
        properties: containerProperties,
        variableAliasRefs: [builtinNamespaceRef('container')]
    }),
    freezeNamespace({
        properties: radiusProperties,
        variableAliasRefs: [builtinNamespaceRef('radius')]
    }),
    freezeNamespace({
        properties: borderColorProperties,
        variableAliasRefs: [builtinNamespaceRef('color-line'), builtinNamespaceRef('color')]
    }),
    freezeNamespace({
        properties: Object.freeze(['accent-color', 'background-color', 'fill', 'filter'] as const),
        variableAliasRefs: [builtinNamespaceRef('color')]
    }),
    freezeNamespace({
        properties: Object.freeze(['caret-color'] as const),
        variableAliasRefs: [builtinNamespaceRef('color-text'), builtinNamespaceRef('color')]
    }),
    freezeNamespace({
        properties: Object.freeze(['stroke'] as const),
        variableAliasRefs: [builtinNamespaceRef('color-line'), builtinNamespaceRef('color')]
    }),
    freezeNamespace({
        properties: Object.freeze(['color'] as const),
        variableAliasRefs: [builtinNamespaceRef('color', true), builtinNamespaceRef('color-text'), builtinNamespaceRef('color')]
    }),
    freezeNamespace({
        properties: Object.freeze(['-webkit-text-fill-color', 'text-decoration-color'] as const),
        variableAliasRefs: [builtinNamespaceRef('color-text'), builtinNamespaceRef('color')]
    }),
    freezeNamespace({
        properties: Object.freeze(['-webkit-text-stroke-color'] as const),
        variableAliasRefs: [builtinNamespaceRef('color')]
    }),
    freezeNamespace({
        properties: Object.freeze(['text-shadow'] as const),
        variableAliasRefs: [builtinNamespaceRef('color')]
    }),
    freezeNamespace({
        properties: Object.freeze(['box-shadow'] as const),
        variableAliasRefs: [builtinNamespaceRef('shadow'), builtinNamespaceRef('color')]
    }),
    freezeNamespace({
        properties: Object.freeze(['animation-delay', 'animation-duration', 'transition-delay', 'transition-duration'] as const),
        variableAliasRefs: [builtinNamespaceRef('duration')]
    }),
    freezeNamespace({
        properties: Object.freeze(['animation-timing-function', 'transition-timing-function'] as const),
        variableAliasRefs: [builtinNamespaceRef('easing')]
    }),
    freezeNamespace({
        properties: Object.freeze(['animation', 'transition'] as const),
        variableAliasRefs: [builtinNamespaceRef('duration'), builtinNamespaceRef('easing')]
    }),
    freezeNamespace({
        properties: Object.freeze(['content'] as const),
        variableAliasRefs: [builtinNamespaceRef('content', true)]
    }),
    freezeNamespace({
        properties: Object.freeze(['font-feature-settings'] as const),
        variableAliasRefs: [builtinNamespaceRef('font-feature', true)]
    }),
    freezeNamespace({
        properties: Object.freeze(['font-family'] as const),
        variableAliasRefs: [builtinNamespaceRef('font-family', true)]
    }),
    freezeNamespace({
        properties: Object.freeze(['font-size'] as const),
        variableAliasRefs: [builtinNamespaceRef('font-size', true)]
    }),
    freezeNamespace({
        properties: Object.freeze(['font-weight'] as const),
        variableAliasRefs: [builtinNamespaceRef('font-weight', true)]
    }),
    freezeNamespace({
        properties: Object.freeze(['letter-spacing'] as const),
        variableAliasRefs: [builtinNamespaceRef('tracking')]
    }),
    freezeNamespace({
        properties: Object.freeze(['line-height'] as const),
        variableAliasRefs: [builtinNamespaceRef('leading')]
    }),
    freezeNamespace({
        properties: Object.freeze(['order'] as const),
        variableAliasRefs: [builtinNamespaceRef('order', true)]
    })
])

export default nativeValueNamespaces
export { nativeValueNamespaces as builtinNativeValueNamespaces }
