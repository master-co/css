import SyntaxRuleType from '../syntax-rule-type'
import { BORDER_STYLE_VALUES } from '../common'
import { SyntaxRuleDefinition } from '../types/config'

const rules = {
    'font-size': {
        aliasGroups: ['font', 'f'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'font-weight': {
        aliasGroups: ['font', 'f'],
        values: ['bolder'],
        type: SyntaxRuleType.Native
    },
    'font-family': {
        aliasGroups: ['font', 'f'],
        type: SyntaxRuleType.Native
    },
    'font-smooth': {
        type: SyntaxRuleType.Native
    },
    'font-style': {
        aliasGroups: ['font', 'f'],
        values: ['normal', 'italic', 'oblique'],
        type: SyntaxRuleType.Native,
        unit: 'deg'
    },
    'font-variant-numeric': {
        aliasGroups: ['font', 'f'],
        values: ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions'],
        type: SyntaxRuleType.Native
    },
    'font-variant': {
        aliasGroups: ['font', 'f'],
        type: SyntaxRuleType.NativeShorthand,
    },
    font: {
        subkey: 'f',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: [
            'font-family',
            'font-variant',
            'font-weight',
            'font-size',
            'font-style',
            // 'line-height' is not included because it conflicts with the 'font-size'
        ]
    },
    'font-feature-settings': {
        key: 'font-feature',
        type: SyntaxRuleType.Native
    },
    color: {
        key: 'fg',
        type: SyntaxRuleType.Native,
        namespaces: ['color.text']
    },
    // margin
    'margin-left': {
        key: 'ml',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'margin-right': {
        key: 'mr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'margin-top': {
        key: 'mt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'margin-bottom': {
        key: 'mb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'margin-x': {
        key: 'mx',
        subkey: 'margin-x',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['margin-left', 'margin-right'],
        namespaces: ['spacing']
    },
    'margin-y': {
        key: 'my',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['margin-top', 'margin-bottom'],
        namespaces: ['spacing']
    },
    margin: {
        key: 'm',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    // margin inline
    'margin-inline-start': {
        key: 'mis',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'margin-inline-end': {
        key: 'mie',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'margin-inline': {
        key: 'mi',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    // padding
    'padding-left': {
        key: 'pl',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'padding-right': {
        key: 'pr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'padding-top': {
        key: 'pt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'padding-bottom': {
        key: 'pb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'padding-x': {
        key: 'px',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['padding-left', 'padding-right'],
        namespaces: ['spacing']
    },
    'padding-y': {
        key: 'py',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['padding-top', 'padding-bottom'],
        namespaces: ['spacing']
    },
    padding: {
        key: 'p',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    // padding inline
    'padding-inline-start': {
        key: 'pis',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'padding-inline-end': {
        key: 'pie',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'padding-inline': {
        key: 'pi',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    // flex
    'flex-basis': {
        aliasGroups: ['flex'],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'flex-wrap': {
        aliasGroups: ['flex'],
        values: ['wrap', 'nowrap', 'wrap-reverse'],
        type: SyntaxRuleType.Native
    },
    'flex-grow': {
        aliasGroups: ['flex'],
        type: SyntaxRuleType.Native
    },
    'flex-shrink': {
        aliasGroups: ['flex'],
        type: SyntaxRuleType.Native
    },
    'flex-direction': {
        aliasGroups: ['flex'],
        values: ['row', 'row-reverse', 'column', 'column-reverse'],
        type: SyntaxRuleType.Native
    },
    flex: {
        type: SyntaxRuleType.NativeShorthand
    },
    display: {
        key: 'd',
        type: SyntaxRuleType.Native,
    },
    width: {
        key: 'w',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    height: {
        key: 'h',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'min-width': {
        key: 'min-w',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'min-height': {
        key: 'min-h',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    size: {
        type: SyntaxRuleType.Shorthand,
        unit: 'rem',
        declarer: ['pair', ['width', 'height']]
    },
    'min-size': {
        key: 'min',
        type: SyntaxRuleType.Shorthand,
        unit: 'rem',
        declarer: ['pair', ['min-width', 'min-height']]
    },
    'max-size': {
        key: 'max',
        type: SyntaxRuleType.Shorthand,
        unit: 'rem',
        declarer: ['pair', ['max-width', 'max-height']]
    },
    'box-sizing': {
        aliasGroups: ['box'],
        type: SyntaxRuleType.Native
    },
    'box-decoration-break': {
        key: 'box-decoration',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-box-decoration-break', 'box-decoration-break']
    },
    container: {
        type: SyntaxRuleType.NativeShorthand
    },
    'container-name': {
        type: SyntaxRuleType.Native
    },
    'container-type': {
        type: SyntaxRuleType.Native,
        aliasGroups: ['container'],
        values: ['size', 'inline-size', 'scroll-state'],
    },
    contain: {
        type: SyntaxRuleType.Native
    },
    content: {
        type: SyntaxRuleType.Native
    },
    'counter-increment': {
        type: SyntaxRuleType.Native
    },
    'counter-reset': {
        type: SyntaxRuleType.Native,
    },
    'letter-spacing': {
        key: 'tracking',
        subkey: 'ls',
        type: SyntaxRuleType.Native,
        unit: 'em'
    },
    'line-height': {
        key: 'leading',
        subkey: 'line-h',
        type: SyntaxRuleType.Native
    },
    'object-fit': {
        aliasGroups: ['object', 'obj'],
        values: ['contain', 'cover', 'fill', 'scale-down'],
        type: SyntaxRuleType.Native,
    },
    'object-position': {
        aliasGroups: ['object', 'obj'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        type: SyntaxRuleType.Native,
    },
    'text-align': {
        aliasGroups: ['text', 't'],
        values: ['justify', 'center', 'left', 'right', 'start', 'end'],
        type: SyntaxRuleType.Native,
    },
    'text-decoration-color': {
        aliasGroups: ['text-decoration'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.text']
    },
    'text-decoration-style': {
        aliasGroups: ['text-decoration'],
        values: ['solid', 'double', 'dotted', 'dashed', 'wavy'],
        type: SyntaxRuleType.Native,
    },
    'text-decoration-thickness': {
        aliasGroups: ['text-decoration'],
        values: ['from-font'],
        kind: 'number',
        type: SyntaxRuleType.Native,
        unit: 'em'
    },
    'text-decoration-line': {
        aliasGroups: ['text-decoration'],
        values: ['underline', 'overline', 'line-through'],
        type: SyntaxRuleType.Native,
    },
    'text-decoration': {
        aliasGroups: ['text', 't'],
        values: ['underline', 'overline', 'line-through'],
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['color.text'],
        declarations: ['-webkit-text-decoration', 'text-decoration']
    },
    'text-underline-offset': {
        aliasGroups: ['text-underline'],
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    'text-underline-position': {
        aliasGroups: ['text-underline'],
        values: ['front-font', 'under', 'left', 'right'],
        type: SyntaxRuleType.Native
    },
    'text-overflow': {
        aliasGroups: ['text', 't'],
        values: ['ellipsis', 'clip'],
        type: SyntaxRuleType.Native
    },
    'text-orientation': {
        aliasGroups: ['text', 't'],
        values: ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation'],
        type: SyntaxRuleType.Native
    },
    'text-transform': {
        aliasGroups: ['text', 't'],
        values: ['uppercase', 'lowercase', 'capitalize'],
        type: SyntaxRuleType.Native,
    },
    'text-rendering': {
        aliasGroups: ['text', 't'],
        values: ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision'],
        type: SyntaxRuleType.Native,
    },
    'text-wrap': {
        aliasGroups: ['text', 't'],
        values: ['wrap', 'nowrap', 'balance', 'pretty'],
        type: SyntaxRuleType.NativeShorthand,
    },
    'text-indent': {
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'vertical-align': {
        key: 'v',
        subkey: 'vertical',
        type: SyntaxRuleType.Native
    },
    columns: {
        key: 'cols',
        type: SyntaxRuleType.NativeShorthand
    },
    'overflow-wrap': {
        type: SyntaxRuleType.Native,
    },
    'white-space': {
        type: SyntaxRuleType.Native
    },
    top: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    bottom: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    left: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    right: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    inset: {
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    'max-height': {
        key: 'max-h',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'max-width': {
        key: 'max-w',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    opacity: {
        type: SyntaxRuleType.Native,
    },
    visibility: {
        type: SyntaxRuleType.Native
    },
    clear: {
        type: SyntaxRuleType.Native,
    },
    float: {
        type: SyntaxRuleType.Native
    },
    isolation: {
        type: SyntaxRuleType.Native
    },
    'overflow-x': {
        type: SyntaxRuleType.Native
    },
    'overflow-y': {
        type: SyntaxRuleType.Native,
    },
    overflow: {
        type: SyntaxRuleType.NativeShorthand,
    },
    'overscroll-behavior-x': {
        type: SyntaxRuleType.Native
    },
    'overscroll-behavior-y': {
        type: SyntaxRuleType.Native
    },
    'overscroll-behavior': {
        type: SyntaxRuleType.NativeShorthand
    },
    'z-index': {
        key: 'z',
        type: SyntaxRuleType.Native
    },
    position: {
        type: SyntaxRuleType.Native
    },
    cursor: {
        type: SyntaxRuleType.Native
    },
    'pointer-events': {
        type: SyntaxRuleType.Native
    },
    resize: {
        type: SyntaxRuleType.Native
    },
    'touch-action': {
        type: SyntaxRuleType.Native
    },
    'word-break': {
        type: SyntaxRuleType.Native
    },
    'word-spacing': {
        type: SyntaxRuleType.Native,
        unit: 'em'
    },
    hyphens: {
        type: SyntaxRuleType.Native
    },
    'user-drag': {
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-user-drag', 'user-drag']
    },
    'user-select': {
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-user-select', 'user-select']
    },
    'text-shadow': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    'text-size': {
        aliasGroups: ['text', 't'],
        kind: 'number',
        unit: 'rem',
        declarations: {
            'font-size': undefined,
            'line-height': ['max(1.8em - max(0rem, ', undefined, ' - 1rem) * 1.12', ', ', undefined, ')'],
            'letter-spacing': ['clamp(-0.072em, calc((', undefined, ' - 1rem) * -0.048), 0em)',]
        },
        type: SyntaxRuleType.Shorthand,
        namespaces: ['font-size']
    },
    'text-fill-color': {
        aliasGroups: ['text', 't'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.text'],
        declarations: ['-webkit-text-fill-color']
    },
    'text-stroke-width': {
        aliasGroups: ['text-stroke'],
        values: ['thin', 'medium', 'thick'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-text-stroke-width']
    },
    'text-stroke-color': {
        aliasGroups: ['text-stroke'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-text-stroke-color'],
        namespaces: ['color']
    },
    'text-stroke': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-text-stroke']
    },
    'text-truncate': {
        subkey: 'lines',
        declarations: {
            display: '-webkit-box',
            '-webkit-box-orient': 'vertical',
            '-webkit-line-clamp': undefined,
            overflow: 'hidden',
            'overflow-wrap': 'break-word',
            'text-overflow': 'ellipsis',
        },
        type: SyntaxRuleType.Shorthand,
    },
    'box-shadow': {
        key: 'shadow',
        subkey: 's',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    'table-layout': {
        type: SyntaxRuleType.Native
    },
    'transform-box': {
        aliasGroups: ['transform'],
        type: SyntaxRuleType.Native
    },
    'transform-style': {
        aliasGroups: ['transform'],
        values: ['flat', 'preserve-3d'],
        type: SyntaxRuleType.Native
    },
    'transform-origin': {
        aliasGroups: ['transform'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        kind: 'number',
        unit: 'px',
        type: SyntaxRuleType.Native
    },
    transform: {
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    'translate()': {
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    'translateX()': {
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    'translateY()': {
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    'translateZ()': {
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    'translate3d()': {
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    'scale()': {
        declarations: ['transform']
    },
    'scaleX()': {
        declarations: ['transform']
    },
    'scaleY()': {
        declarations: ['transform']
    },
    'scaleZ()': {
        declarations: ['transform']
    },
    'scale3d()': {
        declarations: ['transform']
    },
    'rotate()': {
        declarations: ['transform']
    },
    'rotateX()': {
        declarations: ['transform']
    },
    'rotateY()': {
        declarations: ['transform']
    },
    'rotateZ()': {
        declarations: ['transform']
    },
    'rotate3d()': {
        declarations: ['transform']
    },
    'perspective()': {
        declarations: ['transform']
    },
    'matrix()': {
        declarations: ['transform']
    },
    'matrix3d()': {
        declarations: ['transform']
    },
    'transition-property': {
        key: '~property',
        type: SyntaxRuleType.Native
    },
    'transition-timing-function': {
        key: '~easing',
        type: SyntaxRuleType.Native
    },
    'transition-duration': {
        key: '~duration',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    },
    'transition-delay': {
        key: '~delay',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    },
    transition: {
        sign: '~',
        type: SyntaxRuleType.NativeShorthand
    },
    'animation-delay': {
        key: '@delay',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    },
    'animation-direction': {
        key: '@direction',
        type: SyntaxRuleType.Native
    },
    'animation-duration': {
        key: '@duration',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    },
    'animation-fill-mode': {
        key: '@fill',
        type: SyntaxRuleType.Native
    },
    'animation-iteration-count': {
        key: '@iteration',
        type: SyntaxRuleType.Native
    },
    'animation-name': {
        key: '@name',
        type: SyntaxRuleType.Native,
        includeAnimations: true
    },
    'animation-play-state': {
        key: '@play',
        type: SyntaxRuleType.Native
    },
    'animation-timing-function': {
        key: '@easing',
        type: SyntaxRuleType.Native
    },
    animation: {
        sign: '@',
        type: SyntaxRuleType.NativeShorthand,
        includeAnimations: true,
    },
    'border-collapse': {
        aliasGroups: ['b', 'border'],
        values: ['collapse', 'separate'],
        type: SyntaxRuleType.Native
    },
    'border-spacing': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    // border color
    'border-top-color': {
        aliasGroups: ['bt', 'border-top'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    'border-bottom-color': {
        aliasGroups: ['bb', 'border-bottom'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    'border-left-color': {
        aliasGroups: ['bl', 'border-left'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    'border-right-color': {
        aliasGroups: ['br', 'border-right'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    'border-x-color': {
        aliasGroups: ['bx', 'border-x'],
        kind: 'color',
        type: SyntaxRuleType.Shorthand,
        namespaces: ['color', 'color.line'],
        declarations: ['border-left-color', 'border-right-color']
    },
    'border-y-color': {
        aliasGroups: ['by', 'border-y'],
        kind: 'color',
        type: SyntaxRuleType.Shorthand,
        namespaces: ['color', 'color.line'],
        declarations: ['border-top-color', 'border-bottom-color']
    },
    'border-color': {
        aliasGroups: ['b', 'border'],
        kind: 'color',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['color', 'color.line'],
    },
    // border radius
    'border-top-left-radius': {
        key: 'rtl',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['border-radius']
    },
    'border-top-right-radius': {
        key: 'rtr',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['border-radius']
    },
    'border-bottom-left-radius': {
        key: 'rbl',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['border-radius']
    },
    'border-bottom-right-radius': {
        key: 'rbr',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['border-radius']
    },
    'border-top-radius': {
        key: 'rt',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-left-radius', 'border-top-right-radius'],
        namespaces: ['border-radius']
    },
    'border-bottom-radius': {
        key: 'rb',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-bottom-left-radius', 'border-bottom-right-radius'],
        namespaces: ['border-radius']
    },
    'border-left-radius': {
        key: 'rl',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-left-radius', 'border-bottom-left-radius'],
        namespaces: ['border-radius']
    },
    'border-right-radius': {
        key: 'rr',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-right-radius', 'border-bottom-right-radius'],
        namespaces: ['border-radius']
    },
    'border-radius': {
        key: 'r',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand
    },
    // border style
    'border-top-style': {
        aliasGroups: ['bt', 'border-top'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    'border-bottom-style': {
        aliasGroups: ['bb', 'border-bottom'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    'border-left-style': {
        aliasGroups: ['bl', 'border-left'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    'border-right-style': {
        aliasGroups: ['br', 'border-right'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    'border-x-style': {
        aliasGroups: ['bx', 'border-x'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-left-style', 'border-right-style']
    },
    'border-y-style': {
        aliasGroups: ['by', 'border-y'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-style', 'border-bottom-style']
    },
    'border-style': {
        aliasGroups: ['b', 'border'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.NativeShorthand
    },
    // border width
    'border-top-width': {
        aliasGroups: ['bt', 'border-top'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'border-bottom-width': {
        aliasGroups: ['bb', 'border-bottom'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'border-left-width': {
        aliasGroups: ['bl', 'border-left'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'border-right-width': {
        aliasGroups: ['br', 'border-right'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'border-x-width': {
        aliasGroups: ['bx', 'border-x'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-left-width', 'border-right-width']
    },
    'border-y-width': {
        aliasGroups: ['by', 'border-y'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-width', 'border-bottom-width']
    },
    'border-width': {
        aliasGroups: ['b', 'border'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand
    },
    // border image
    'border-image-repeat': {
        aliasGroups: ['border-image'],
        values: ['stretch', 'repeat', 'round', 'space'],
        type: SyntaxRuleType.Native
    },
    'border-image-slice': {
        aliasGroups: ['border-image'],
        type: SyntaxRuleType.Native
    },
    'border-image-source': {
        aliasGroups: ['border-image'],
        kind: 'image',
        type: SyntaxRuleType.Native
    },
    'border-image-width': {
        aliasGroups: ['border-image'],
        values: ['auto'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'border-image-outset': {
        aliasGroups: ['border-image'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'border-image': {
        type: SyntaxRuleType.NativeShorthand
    },
    // border
    'border-top': {
        key: 'bt',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    'border-bottom': {
        key: 'bb',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    'border-left': {
        key: 'bl',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    'border-right': {
        key: 'br',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    'border-x': {
        key: 'bx',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
        declarations: ['border-left', 'border-right']
    },
    'border-y': {
        key: 'by',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
        declarations: ['border-top', 'border-bottom']
    },
    border: {
        key: 'b',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    'background-attachment': {
        aliasGroups: ['bg'],
        values: ['fixed', 'local', 'scroll'],
        type: SyntaxRuleType.Native
    },
    'background-blend-mode': {
        key: 'bg-blend',
        type: SyntaxRuleType.Native
    },
    'background-color': {
        aliasGroups: ['bg'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    'background-clip': {
        key: 'bg-clip',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-background-clip', 'background-clip']
    },
    'background-origin': {
        key: 'bg-origin',
        type: SyntaxRuleType.Native
    },
    'background-position': {
        aliasGroups: ['bg'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        type: SyntaxRuleType.Native,
        unit: 'px'
    },
    'background-repeat': {
        aliasGroups: ['bg'],
        values: ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'],
        type: SyntaxRuleType.Native
    },
    'background-size': {
        aliasGroups: ['bg'],
        values: ['auto', 'cover', 'contain'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'background-image': {
        aliasGroups: ['bg'],
        kind: 'image',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    background: {
        key: 'bg',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['color']
    },
    'gradient()': {
        declarations: {
            'background-image': ['linear-', undefined]
        },
        namespaces: ['color']
    },
    'mix-blend-mode': {
        key: 'blend',
        type: SyntaxRuleType.Native
    },
    'backdrop-filter': {
        key: 'bd',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-backdrop-filter', 'backdrop-filter'],
        namespaces: ['color']
    },
    filter: {
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    'blur()': {
        declarations: ['filter']
    },
    'brightness()': {
        declarations: ['filter']
    },
    'contrast()': {
        declarations: ['filter']
    },
    'drop-shadow()': {
        declarations: ['filter'],
        namespaces: ['color']
    },
    'grayscale()': {
        declarations: ['filter']
    },
    'hue-rotate()': {
        declarations: ['filter']
    },
    'invert()': {
        declarations: ['filter']
    },
    'opacity()': {
        declarations: ['filter']
    },
    'saturate()': {
        declarations: ['filter']
    },
    'sepia()': {
        declarations: ['filter']
    },
    fill: {
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    'stroke-dasharray': {
        type: SyntaxRuleType.Native
    },
    'stroke-dashoffset': {
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    'stroke-width': {
        aliasGroups: ['stroke'],
        kind: 'number',
        type: SyntaxRuleType.Native
    },
    stroke: {
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    x: {
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    y: {
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    cx: {
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    cy: {
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    rx: {
        type: SyntaxRuleType.Native
    },
    ry: {
        type: SyntaxRuleType.Native
    },
    'grid-column-start': {
        key: 'grid-col-start',
        type: SyntaxRuleType.Native
    },
    'grid-column-end': {
        key: 'grid-col-end',
        type: SyntaxRuleType.Native
    },
    'grid-column-span': {
        key: 'grid-col-span',
        type: SyntaxRuleType.Shorthand,
        declarations: {
            'grid-column': ['span ', undefined, '/span ', undefined]
        }
    },
    'grid-column': {
        key: 'grid-col',
        type: SyntaxRuleType.NativeShorthand,
    },
    'grid-columns': {
        key: 'grid-cols',
        declarations: {
            display: 'grid',
            'grid-template-columns': ['repeat(', undefined, ',minmax(0,1fr))'],
        },
        type: SyntaxRuleType.Shorthand
    },
    'grid-row-start': {
        type: SyntaxRuleType.Native
    },
    'grid-row-end': {
        type: SyntaxRuleType.Native
    },
    'grid-row-span': {
        type: SyntaxRuleType.Shorthand,
        declarations: {
            'grid-row': ['span ', undefined, '/span ', undefined]
        }
    },
    'grid-row': {
        type: SyntaxRuleType.NativeShorthand
    },
    'grid-rows': {
        declarations: {
            display: 'grid',
            'grid-auto-flow': 'column',
            'grid-template-rows': ['repeat(', undefined, ',minmax(0,1fr))'],
        },
        type: SyntaxRuleType.Shorthand
    },
    'grid-auto-columns': {
        key: 'grid-auto-cols',
        type: SyntaxRuleType.Native
    },
    'grid-auto-flow': {
        key: 'grid-flow',
        type: SyntaxRuleType.Native
    },
    'grid-auto-rows': {
        type: SyntaxRuleType.Native
    },
    'grid-template-areas': {
        type: SyntaxRuleType.Native
    },
    'grid-template-columns': {
        key: 'grid-template-cols',
        type: SyntaxRuleType.Native,
        unit: 'rem'
    },
    'grid-template-rows': {
        type: SyntaxRuleType.Native,
        unit: 'rem'
    },
    'grid-template': {
        type: SyntaxRuleType.NativeShorthand
    },
    'grid-area': {
        type: SyntaxRuleType.NativeShorthand
    },
    grid: {
        type: SyntaxRuleType.NativeShorthand
    },
    'column-gap': {
        key: 'gap-x',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    'row-gap': {
        key: 'gap-y',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    gap: {
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    order: {
        key: 'o',
        type: SyntaxRuleType.Native
    },
    'break-inside': {
        type: SyntaxRuleType.Native
    },
    'break-before': {
        type: SyntaxRuleType.Native
    },
    'break-after': {
        type: SyntaxRuleType.Native
    },
    'aspect-ratio': {
        key: 'aspect',
        type: SyntaxRuleType.Native
    },
    'column-span': {
        key: 'col-span',
        type: SyntaxRuleType.Native
    },
    'align-content': {
        subkey: 'ac',
        type: SyntaxRuleType.Native
    },
    'align-items': {
        subkey: 'ai',
        type: SyntaxRuleType.Native
    },
    'align-self': {
        subkey: 'as',
        type: SyntaxRuleType.Native
    },
    'justify-content': {
        subkey: 'jc',
        type: SyntaxRuleType.Native
    },
    'justify-items': {
        subkey: 'ji',
        type: SyntaxRuleType.Native
    },
    'justify-self': {
        subkey: 'js',
        type: SyntaxRuleType.Native
    },
    'place-content': {
        type: SyntaxRuleType.NativeShorthand
    },
    'place-items': {
        type: SyntaxRuleType.NativeShorthand
    },
    'place-self': {
        type: SyntaxRuleType.NativeShorthand
    },
    'list-style-position': {
        aliasGroups: ['list-style'],
        values: ['inside', 'outside'],
        type: SyntaxRuleType.Native
    },
    'list-style-type': {
        aliasGroups: ['list-style'],
        values: ['disc', 'decimal'],
        type: SyntaxRuleType.Native
    },
    'list-style-image': {
        aliasGroups: ['list-style'],
        kind: 'image',
        type: SyntaxRuleType.Native
    },
    'list-style': {
        type: SyntaxRuleType.NativeShorthand
    },
    'outline-color': {
        aliasGroups: ['outline'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    'outline-offset': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    'outline-style': {
        aliasGroups: ['outline'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native
    },
    'outline-width': {
        aliasGroups: ['outline'],
        values: ['medium', 'thick', 'thin'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    outline: {
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: [
            'outline-width',
            'outline-style',
            'outline-offset',
            'outline-color',
            'color.line',
            'color'
        ],
        transformer: 'auto-fill-solid'
    },
    'accent-color': {
        key: 'accent',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    appearance: {
        type: SyntaxRuleType.Native
    },
    'caret-color': {
        key: 'caret',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.text']
    },
    'scroll-behavior': {
        type: SyntaxRuleType.Native
    },
    // scroll margin
    'scroll-margin-left': {
        key: 'scroll-ml',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'scroll-margin-right': {
        key: 'scroll-mr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'scroll-margin-top': {
        key: 'scroll-mt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'scroll-margin-bottom': {
        key: 'scroll-mb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'scroll-margin-x': {
        key: 'scroll-mx',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['scroll-margin-left', 'scroll-margin-right'],
        namespaces: ['spacing']
    },
    'scroll-margin-y': {
        key: 'scroll-my',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['scroll-margin-top', 'scroll-margin-bottom'],
        namespaces: ['spacing']
    },
    'scroll-margin': {
        key: 'scroll-m',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    // scroll padding
    'scroll-padding-left': {
        key: 'scroll-pl',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'scroll-padding-right': {
        key: 'scroll-pr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'scroll-padding-top': {
        key: 'scroll-pt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'scroll-padding-bottom': {
        key: 'scroll-pb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    'scroll-padding-x': {
        key: 'scroll-px',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['scroll-padding-left', 'scroll-padding-right'],
        namespaces: ['spacing']
    },
    'scroll-padding-y': {
        key: 'scroll-py',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['scroll-padding-top', 'scroll-padding-bottom'],
        namespaces: ['spacing']
    },
    'scroll-padding': {
        key: 'scroll-p',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    // scroll snap
    'scroll-snap-align': {
        aliasGroups: ['scroll-snap'],
        values: ['start', 'end', 'center'],
        type: SyntaxRuleType.Native
    },
    'scroll-snap-stop': {
        aliasGroups: ['scroll-snap'],
        values: ['normal', 'always'],
        type: SyntaxRuleType.Native
    },
    'scroll-snap-type': {
        aliasGroups: ['scroll-snap'],
        values: ['x', 'y', 'block', 'inline', 'both'],
        type: SyntaxRuleType.Native
    },
    'will-change': {
        type: SyntaxRuleType.Native
    },
    'writing-mode': {
        key: 'writing',
        type: SyntaxRuleType.Native
    },
    direction: {
        type: SyntaxRuleType.Native
    },
    'shape-outside': {
        key: 'shape',
        type: SyntaxRuleType.Native
    },
    'shape-margin': {
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    'shape-image-threshold': {
        type: SyntaxRuleType.Native
    },
    'clip-path': {
        key: 'clip',
        type: SyntaxRuleType.Native
    },
    quotes: {
        type: SyntaxRuleType.Native
    },
    'mask-image': {
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-mask-image', 'mask-image']
    },
    group: {
        matcher: '^\\{.+?\\}',
        type: SyntaxRuleType.Shorthand,
        declarer: 'core.group'
    },
    variable: {
        matcher: '^\\$[\\w-]+:', // don't use 'rem' as default, because css variable is common API
        type: SyntaxRuleType.Shorthand,
        declarer: 'core.variable'
    },
} satisfies Record<string, SyntaxRuleDefinition>

export default rules