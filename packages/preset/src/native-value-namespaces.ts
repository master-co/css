import type { MasterCSSPlanNativeValueNamespaces } from 'shared/master-css-plan'
import { namespaceRef } from './namespaces'

const spacingProperties = [
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
]

const spacingUnitlessProperties = [
    'cx',
    'cy',
    'stroke-dashoffset',
    'x',
    'y'
]

const containerProperties = [
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
]

const radiusProperties = [
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-end-end-radius',
    'border-end-start-radius',
    'border-radius',
    'border-start-end-radius',
    'border-start-start-radius',
    'border-top-left-radius',
    'border-top-right-radius'
]

const borderColorProperties = [
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
]

const nativeValueNamespaces = [
    {
        properties: spacingProperties,
        variableAliasRefs: [namespaceRef('spacing')]
    },
    {
        properties: spacingUnitlessProperties,
        variableAliasRefs: [namespaceRef('spacing')]
    },
    {
        properties: containerProperties,
        variableAliasRefs: [namespaceRef('container')]
    },
    {
        properties: radiusProperties,
        variableAliasRefs: [namespaceRef('radius')]
    },
    {
        properties: borderColorProperties,
        variableAliasRefs: [namespaceRef('color-line'), namespaceRef('color')]
    },
    {
        properties: ['accent-color', 'background-color', 'fill', 'filter'],
        variableAliasRefs: [namespaceRef('color')]
    },
    {
        properties: ['caret-color'],
        variableAliasRefs: [namespaceRef('color-text'), namespaceRef('color')]
    },
    {
        properties: ['stroke'],
        variableAliasRefs: [namespaceRef('color-line'), namespaceRef('color')]
    },
    {
        properties: ['color'],
        variableAliasRefs: [namespaceRef('color', true), namespaceRef('color-text'), namespaceRef('color')]
    },
    {
        properties: ['-webkit-text-fill-color', 'text-decoration-color'],
        variableAliasRefs: [namespaceRef('color-text'), namespaceRef('color')]
    },
    {
        properties: ['-webkit-text-stroke-color'],
        variableAliasRefs: [namespaceRef('color')]
    },
    {
        properties: ['text-shadow'],
        variableAliasRefs: [namespaceRef('color')]
    },
    {
        properties: ['box-shadow'],
        variableAliasRefs: [namespaceRef('shadow'), namespaceRef('color')]
    },
    {
        properties: ['animation-delay', 'animation-duration', 'transition-delay', 'transition-duration'],
        variableAliasRefs: [namespaceRef('duration')]
    },
    {
        properties: ['animation-timing-function', 'transition-timing-function'],
        variableAliasRefs: [namespaceRef('easing')]
    },
    {
        properties: ['transition'],
        variableAliasRefs: [namespaceRef('duration'), namespaceRef('easing')]
    },
    {
        properties: ['content'],
        variableAliasRefs: [namespaceRef('content', true)]
    },
    {
        properties: ['font-feature-settings'],
        variableAliasRefs: [namespaceRef('font-feature', true)]
    },
    {
        properties: ['font-family'],
        variableAliasRefs: [namespaceRef('font-family', true)]
    },
    {
        properties: ['font-size'],
        variableAliasRefs: [namespaceRef('font-size', true)]
    },
    {
        properties: ['font-weight'],
        variableAliasRefs: [namespaceRef('font-weight', true)]
    },
    {
        properties: ['letter-spacing'],
        variableAliasRefs: [namespaceRef('tracking')]
    },
    {
        properties: ['line-height'],
        variableAliasRefs: [namespaceRef('leading')]
    },
    {
        properties: ['order'],
        variableAliasRefs: [namespaceRef('order', true)]
    }
] satisfies MasterCSSPlanNativeValueNamespaces

export default nativeValueNamespaces
