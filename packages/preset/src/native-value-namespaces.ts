import type { MasterCSSPlanNativeValueNamespaces } from 'shared/master-css-plan'

const spacingProperties = [
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
    'text-underline-offset',
    'top',
    'translate',
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

const borderWidthProperties = [
    'border-block-end-width',
    'border-block-start-width',
    'border-block-width',
    'border-bottom-width',
    'border-inline-end-width',
    'border-inline-start-width',
    'border-inline-width',
    'border-left-width',
    'outline-width',
    'border-right-width',
    'stroke-width',
    '-webkit-text-stroke-width',
    'border-top-width',
    'border-width'
]

const borderStyleProperties = [
    'border-block-end-style',
    'border-block-start-style',
    'border-block-style',
    'border-bottom-style',
    'border-inline-end-style',
    'border-inline-start-style',
    'border-inline-style',
    'border-left-style',
    'border-right-style',
    'border-style',
    'border-top-style'
]

const nativeValueNamespaces = [
    {
        properties: spacingProperties,
        variableAliasRefs: ['~spacing']
    },
    {
        properties: spacingUnitlessProperties,
        variableAliasRefs: ['~spacing']
    },
    {
        properties: containerProperties,
        variableAliasRefs: ['~container']
    },
    {
        properties: radiusProperties,
        variableAliasRefs: ['~radius']
    },
    {
        properties: borderColorProperties,
        variableAliasRefs: ['~color-line', '~color']
    },
    {
        properties: borderWidthProperties,
        variableAliasRefs: ['=border-width']
    },
    {
        properties: borderStyleProperties,
        variableAliasRefs: ['=border-style']
    },
    {
        properties: ['accent-color', 'background-color', 'fill', 'filter'],
        variableAliasRefs: ['~color']
    },
    {
        properties: ['caret-color'],
        variableAliasRefs: ['~color-text', '~color']
    },
    {
        properties: ['stroke'],
        variableAliasRefs: ['~color-line', '~color']
    },
    {
        properties: ['color'],
        variableAliasRefs: ['=color', '~color-text', '~color']
    },
    {
        properties: ['-webkit-text-fill-color', 'text-decoration-color'],
        variableAliasRefs: ['~color-text', '~color']
    },
    {
        properties: ['-webkit-text-stroke-color'],
        variableAliasRefs: ['~color']
    },
    {
        properties: ['text-shadow'],
        variableAliasRefs: ['~color']
    },
    {
        properties: ['box-shadow'],
        variableAliasRefs: ['~shadow', '~color']
    },
    {
        properties: ['animation-duration', 'transition-duration'],
        variableAliasRefs: ['~duration']
    },
    {
        properties: ['animation-timing-function', 'transition-timing-function'],
        variableAliasRefs: ['~easing']
    },
    {
        properties: ['transition'],
        variableAliasRefs: ['~duration', '~easing']
    },
    {
        properties: ['font-feature-settings'],
        variableAliasRefs: ['=font-feature']
    },
    {
        properties: ['font-family'],
        variableAliasRefs: ['=font-family']
    },
    {
        properties: ['font-size'],
        variableAliasRefs: ['=font-size']
    },
    {
        properties: ['font-weight'],
        variableAliasRefs: ['=font-weight']
    },
    {
        properties: ['letter-spacing'],
        variableAliasRefs: ['~tracking']
    },
    {
        properties: ['line-height'],
        variableAliasRefs: ['~leading']
    },
    {
        properties: ['order'],
        variableAliasRefs: ['=order']
    },
    {
        properties: ['mask-position'],
        variableAliasRefs: ['=mask-position']
    },
    {
        properties: ['mask-size'],
        variableAliasRefs: ['~container', '=mask-size']
    },
    {
        properties: ['perspective'],
        variableAliasRefs: ['=perspective']
    },
    {
        properties: ['perspective-origin'],
        variableAliasRefs: ['=perspective-origin']
    }
] satisfies MasterCSSPlanNativeValueNamespaces

export default nativeValueNamespaces
