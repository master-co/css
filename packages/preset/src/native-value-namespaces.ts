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
    'top',
    'translate'
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

const nativeValueNamespaces = [
    {
        properties: spacingProperties,
        variableAliasRefs: ['~spacing'],
        unit: 'rem'
    },
    {
        properties: spacingUnitlessProperties,
        variableAliasRefs: ['~spacing']
    },
    {
        properties: containerProperties,
        variableAliasRefs: ['~container'],
        unit: 'rem'
    },
    {
        properties: radiusProperties,
        variableAliasRefs: ['~radius'],
        unit: 'rem'
    },
    {
        properties: ['accent-color', 'fill', 'filter'],
        variableAliasRefs: ['~color']
    },
    {
        properties: ['caret-color'],
        variableAliasRefs: ['~color-text', '~color']
    },
    {
        properties: ['color'],
        variableAliasRefs: ['=color', '~color-text', '~color']
    },
    {
        properties: ['text-shadow'],
        variableAliasRefs: ['~color'],
        unit: 'rem'
    },
    {
        properties: ['box-shadow'],
        variableAliasRefs: ['~shadow', '~color'],
        unit: 'rem'
    },
    {
        properties: ['animation-duration', 'transition-duration'],
        variableAliasRefs: ['~duration'],
        unit: 'ms'
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
        properties: ['letter-spacing'],
        variableAliasRefs: ['~tracking'],
        unit: 'em'
    },
    {
        properties: ['line-height'],
        variableAliasRefs: ['~leading']
    },
    {
        properties: ['order'],
        variableAliasRefs: ['=order']
    }
] satisfies MasterCSSPlanNativeValueNamespaces

export default nativeValueNamespaces
