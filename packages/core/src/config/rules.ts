import SyntaxRuleType from '../syntax-rule-type'
import { BORDER_STYLE_VALUES } from '../common'
import type { SyntaxRuleDefinitions } from '../types/config'

const rules = [
    {
        name: 'container',
        type: SyntaxRuleType.Static,
        declarations: { 'container-type': 'inline-size' }
    },
    {
        name: 'square',
        type: SyntaxRuleType.Static,
        declarations: { 'aspect-ratio': '1/1' }
    },
    {
        name: 'video',
        type: SyntaxRuleType.Static,
        declarations: { 'aspect-ratio': '16/9' }
    },
    {
        name: 'rounded',
        type: SyntaxRuleType.Static,
        declarations: { 'border-radius': '1e9em' }
    },
    {
        name: 'round',
        type: SyntaxRuleType.Static,
        declarations: { 'border-radius': '50%', 'aspect-ratio': '1/1' }
    },
    {
        name: 'hidden',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'none' }
    },
    {
        name: 'block',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'block' }
    },
    {
        name: 'table',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'table' }
    },
    {
        name: 'flex',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'flex' }
    },
    {
        name: 'grid',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'grid' }
    },
    {
        name: 'contents',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'contents' }
    },
    {
        name: 'inline',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'inline' }
    },
    {
        name: 'inline-block',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'inline-block' }
    },
    {
        name: 'inline-flex',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'inline-flex' }
    },
    {
        name: 'inline-grid',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'inline-grid' }
    },
    {
        name: 'inline-table',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'inline-table' }
    },
    {
        name: 'table-cell',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'table-cell' }
    },
    {
        name: 'table-caption',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'table-caption' }
    },
    {
        name: 'flow-root',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'flow-root' }
    },
    {
        name: 'list-item',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'list-item' }
    },
    {
        name: 'table-row',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'table-row' }
    },
    {
        name: 'table-column',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'table-column' }
    },
    {
        name: 'table-row-group',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'table-row-group' }
    },
    {
        name: 'table-column-group',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'table-column-group' }
    },
    {
        name: 'table-header-group',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'table-header-group' }
    },
    {
        name: 'table-footer-group',
        type: SyntaxRuleType.Static,
        declarations: { 'display': 'table-footer-group' }
    },
    {
        name: 'italic',
        type: SyntaxRuleType.Static,
        declarations: { 'font-style': 'italic' }
    },
    {
        name: 'oblique',
        type: SyntaxRuleType.Static,
        declarations: { 'font-style': 'oblique' }
    },
    {
        name: 'isolate',
        type: SyntaxRuleType.Static,
        declarations: { 'isolation': 'isolate' }
    },
    {
        name: 'overflow',
        type: SyntaxRuleType.Static,
        declarations: { 'overflow': 'visible' }
    },
    {
        name: 'untouchable',
        type: SyntaxRuleType.Static,
        declarations: { 'pointer-events': 'none' }
    },
    {
        name: 'static',
        type: SyntaxRuleType.Static,
        declarations: { 'position': 'static' }
    },
    {
        name: 'fixed',
        type: SyntaxRuleType.Static,
        declarations: { 'position': 'fixed' }
    },
    {
        name: 'abs',
        type: SyntaxRuleType.Static,
        declarations: { 'position': 'absolute' }
    },
    {
        name: 'rel',
        type: SyntaxRuleType.Static,
        declarations: { 'position': 'relative' }
    },
    {
        name: 'sticky',
        type: SyntaxRuleType.Static,
        declarations: { 'position': 'sticky' }
    },
    {
        name: 'uppercase',
        type: SyntaxRuleType.Static,
        declarations: { 'text-transform': 'uppercase' }
    },
    {
        name: 'lowercase',
        type: SyntaxRuleType.Static,
        declarations: { 'text-transform': 'lowercase' }
    },
    {
        name: 'capitalize',
        type: SyntaxRuleType.Static,
        declarations: { 'text-transform': 'capitalize' }
    },
    {
        name: 'visible',
        type: SyntaxRuleType.Static,
        declarations: { 'visibility': 'visible' }
    },
    {
        name: 'invisible',
        type: SyntaxRuleType.Static,
        declarations: { 'visibility': 'hidden' }
    },
    {
        name: 'justify-normal',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'normal' }
    },
    {
        name: 'justify-left',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'left' }
    },
    {
        name: 'justify-center',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'center' }
    },
    {
        name: 'justify-right',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'right' }
    },
    {
        name: 'justify-stretch',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'stretch' }
    },
    {
        name: 'justify-start',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'start' }
    },
    {
        name: 'justify-end',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'end' }
    },
    {
        name: 'justify-flex-start',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'flex-start' }
    },
    {
        name: 'justify-flex-end',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'flex-end' }
    },
    {
        name: 'justify-around',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'space-around' }
    },
    {
        name: 'justify-between',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'space-between' }
    },
    {
        name: 'justify-evenly',
        type: SyntaxRuleType.Static,
        declarations: { 'justify-content': 'space-evenly' }
    },
    {
        name: 'content-normal',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'normal' }
    },
    {
        name: 'content-baseline',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'baseline' }
    },
    {
        name: 'content-center',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'center' }
    },
    {
        name: 'content-stretch',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'stretch' }
    },
    {
        name: 'content-start',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'start' }
    },
    {
        name: 'content-end',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'end' }
    },
    {
        name: 'content-flex-start',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'flex-start' }
    },
    {
        name: 'content-flex-end',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'flex-end' }
    },
    {
        name: 'content-around',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'space-around' }
    },
    {
        name: 'content-between',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'space-between' }
    },
    {
        name: 'content-evenly',
        type: SyntaxRuleType.Static,
        declarations: { 'align-content': 'space-evenly' }
    },
    {
        name: 'items-normal',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'normal' }
    },
    {
        name: 'items-baseline',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'baseline' }
    },
    {
        name: 'items-center',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'center' }
    },
    {
        name: 'items-stretch',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'stretch' }
    },
    {
        name: 'items-start',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'start' }
    },
    {
        name: 'items-end',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'end' }
    },
    {
        name: 'items-flex-start',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'flex-start' }
    },
    {
        name: 'items-flex-end',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'flex-end' }
    },
    {
        name: 'items-self-start',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'self-start' }
    },
    {
        name: 'items-self-end',
        type: SyntaxRuleType.Static,
        declarations: { 'align-items': 'self-end' }
    },
    {
        name: 'self-auto',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'auto' }
    },
    {
        name: 'self-normal',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'normal' }
    },
    {
        name: 'self-baseline',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'baseline' }
    },
    {
        name: 'self-center',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'center' }
    },
    {
        name: 'self-stretch',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'stretch' }
    },
    {
        name: 'self-start',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'start' }
    },
    {
        name: 'self-end',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'end' }
    },
    {
        name: 'self-flex-start',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'flex-start' }
    },
    {
        name: 'self-flex-end',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'flex-end' }
    },
    {
        name: 'self-self-start',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'self-start' }
    },
    {
        name: 'self-self-end',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'self-end' }
    },
    {
        name: 'self-anchor-center',
        type: SyntaxRuleType.Static,
        declarations: { 'align-self': 'anchor-center' }
    },
    {
        name: 'vw',
        type: SyntaxRuleType.Static,
        declarations: { 'width': '100vw' }
    },
    {
        name: 'vh',
        type: SyntaxRuleType.Static,
        declarations: { 'height': '100vh' }
    },
    {
        name: 'box-border',
        type: SyntaxRuleType.Static,
        declarations: { 'box-sizing': 'border-box' }
    },
    {
        name: 'box-content',
        type: SyntaxRuleType.Static,
        declarations: { 'box-sizing': 'content-box' }
    },
    {
        name: 'transform-content',
        type: SyntaxRuleType.Static,
        declarations: { 'transform-box': 'content-box' }
    },
    {
        name: 'transform-border',
        type: SyntaxRuleType.Static,
        declarations: { 'transform-box': 'border-box' }
    },
    {
        name: 'transform-fill',
        type: SyntaxRuleType.Static,
        declarations: { 'transform-box': 'fill-box' }
    },
    {
        name: 'transform-stroke',
        type: SyntaxRuleType.Static,
        declarations: { 'transform-box': 'stroke-box' }
    },
    {
        name: 'transform-view',
        type: SyntaxRuleType.Static,
        declarations: { 'transform-box': 'view-box' }
    },
    {
        name: 'bg-clip-content',
        type: SyntaxRuleType.Static,
        declarations: { 'background-clip': 'content-box' }
    },
    {
        name: 'bg-clip-padding',
        type: SyntaxRuleType.Static,
        declarations: { 'background-clip': 'padding-box' }
    },
    {
        name: 'bg-clip-border',
        type: SyntaxRuleType.Static,
        declarations: { 'background-clip': 'border-box' }
    },
    {
        name: 'bg-clip-text',
        type: SyntaxRuleType.Static,
        declarations: { 'background-clip': 'text' }
    },
    {
        name: 'bg-origin-content',
        type: SyntaxRuleType.Static,
        declarations: { 'background-origin': 'content-box' }
    },
    {
        name: 'bg-origin-padding',
        type: SyntaxRuleType.Static,
        declarations: { 'background-origin': 'padding-box' }
    },
    {
        name: 'bg-origin-border',
        type: SyntaxRuleType.Static,
        declarations: { 'background-origin': 'border-box' }
    },
    {
        name: 'shape-none',
        type: SyntaxRuleType.Static,
        declarations: { 'shape-outside': 'none' }
    },
    {
        name: 'shape-margin',
        type: SyntaxRuleType.Static,
        declarations: { 'shape-outside': 'margin-box' }
    },
    {
        name: 'shape-content',
        type: SyntaxRuleType.Static,
        declarations: { 'shape-outside': 'content-box' }
    },
    {
        name: 'shape-border',
        type: SyntaxRuleType.Static,
        declarations: { 'shape-outside': 'border-box' }
    },
    {
        name: 'shape-padding',
        type: SyntaxRuleType.Static,
        declarations: { 'shape-outside': 'padding-box' }
    },
    {
        name: 'clip-none',
        type: SyntaxRuleType.Static,
        declarations: { 'clip-path': 'none' }
    },
    {
        name: 'clip-margin',
        type: SyntaxRuleType.Static,
        declarations: { 'clip-path': 'margin-box' }
    },
    {
        name: 'clip-content',
        type: SyntaxRuleType.Static,
        declarations: { 'clip-path': 'content-box' }
    },
    {
        name: 'clip-border',
        type: SyntaxRuleType.Static,
        declarations: { 'clip-path': 'border-box' }
    },
    {
        name: 'clip-padding',
        type: SyntaxRuleType.Static,
        declarations: { 'clip-path': 'padding-box' }
    },
    {
        name: 'clip-fill',
        type: SyntaxRuleType.Static,
        declarations: { 'clip-path': 'fill-box' }
    },
    {
        name: 'clip-stroke',
        type: SyntaxRuleType.Static,
        declarations: { 'clip-path': 'stroke-box' }
    },
    {
        name: 'clip-view',
        type: SyntaxRuleType.Static,
        declarations: { 'clip-path': 'view-box' }
    },
    {
        name: 'flex-row',
        type: SyntaxRuleType.Static,
        declarations: { 'flex-direction': 'row' }
    },
    {
        name: 'flex-row-reverse',
        type: SyntaxRuleType.Static,
        declarations: { 'flex-direction': 'row-reverse' }
    },
    {
        name: 'flex-col',
        type: SyntaxRuleType.Static,
        declarations: { 'flex-direction': 'column' }
    },
    {
        name: 'flex-col-reverse',
        type: SyntaxRuleType.Static,
        declarations: { 'flex-direction': 'column-reverse' }
    },
    {
        name: 'max-vw',
        type: SyntaxRuleType.Static,
        declarations: { 'max-width': '100vw' }
    },
    {
        name: 'max-vh',
        type: SyntaxRuleType.Static,
        declarations: { 'max-height': '100vh' }
    },
    {
        name: 'min-vw',
        type: SyntaxRuleType.Static,
        declarations: { 'min-width': '100vw' }
    },
    {
        name: 'min-vh',
        type: SyntaxRuleType.Static,
        declarations: { 'min-height': '100vh' }
    },
    {
        name: 'full',
        type: SyntaxRuleType.Static,
        declarations: { 'width': '100%', 'height': '100%' }
    },
    {
        name: 'top',
        type: SyntaxRuleType.Static,
        declarations: { 'top': 0 }
    },
    {
        name: 'left',
        type: SyntaxRuleType.Static,
        declarations: { 'left': 0 }
    },
    {
        name: 'right',
        type: SyntaxRuleType.Static,
        declarations: { 'right': 0 }
    },
    {
        name: 'bottom',
        type: SyntaxRuleType.Static,
        declarations: { 'bottom': 0 }
    },
    {
        name: 'center',
        type: SyntaxRuleType.Static,
        declarations: { 'left': 0, 'right': 0, 'margin-left': 'auto', 'margin-right': 'auto' }
    },
    {
        name: 'middle',
        type: SyntaxRuleType.Static,
        declarations: { 'top': 0, 'bottom': 0, 'margin-top': 'auto', 'margin-bottom': 'auto' }
    },
    {
        name: 'break-spaces',
        type: SyntaxRuleType.Static,
        declarations: { 'white-space': 'break-spaces' }
    },
    {
        name: 'break-word',
        type: SyntaxRuleType.Static,
        declarations: { 'word-break': 'break-word' }
    },
    {
        name: 'wrap-break-word',
        type: SyntaxRuleType.Static,
        declarations: { 'overflow-wrap': 'break-word' }
    },
    {
        name: 'wrap-anywhere',
        type: SyntaxRuleType.Static,
        declarations: { 'overflow-wrap': 'anywhere' }
    },
    {
        name: 'wrap-normal',
        type: SyntaxRuleType.Static,
        declarations: { 'overflow-wrap': 'normal' }
    },
    {
        name: 'gradient-text',
        type: SyntaxRuleType.Static,
        declarations: { '-webkit-text-fill-color': 'transparent', 'background-clip': 'text' }
    },
    {
        name: 'fit',
        type: SyntaxRuleType.Static,
        declarations: { 'width': 'fit-content', 'height': 'fit-content' }
    },
    {
        name: 'font-antialiased',
        type: SyntaxRuleType.Static,
        declarations: { '-webkit-font-smoothing': 'antialiased', '-moz-osx-font-smoothing': 'grayscale' }
    },
    {
        name: 'font-subpixel-antialiased',
        type: SyntaxRuleType.Static,
        declarations: { '-webkit-font-smoothing': 'auto', '-moz-osx-font-smoothing': 'auto' }
    },
    {
        name: 'sr-only',
        type: SyntaxRuleType.Static,
        declarations: { 'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0', 'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0,0,0,0)', 'white-space': 'nowrap', 'border-width': '0' }
    },
    {
        name: 'font-size',
        aliasGroups: ['font', 'f'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'font-weight',
        aliasGroups: ['font', 'f'],
        values: ['bolder'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'font-family',
        aliasGroups: ['font', 'f'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'font-smooth',
        type: SyntaxRuleType.Native
    },
    {
        name: 'font-style',
        aliasGroups: ['font', 'f'],
        values: ['normal', 'italic', 'oblique'],
        type: SyntaxRuleType.Native,
        unit: 'deg'
    },
    {
        name: 'font-variant-numeric',
        aliasGroups: ['font', 'f'],
        values: ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'font-variant',
        aliasGroups: ['font', 'f'],
        type: SyntaxRuleType.NativeShorthand,
    },
    {
        name: 'font',
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
    {
        name: 'font-feature-settings',
        key: 'font-feature',
        type: SyntaxRuleType.Native
    },
    {
        name: 'color',
        key: 'fg',
        type: SyntaxRuleType.Native,
        namespaces: ['color.text']
    },
    {
        name: 'margin-left',
        key: 'ml',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-right',
        key: 'mr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-top',
        key: 'mt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-bottom',
        key: 'mb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-x',
        key: 'mx',
        subkey: 'margin-x',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['margin-left', 'margin-right'],
        namespaces: ['spacing']
    },
    {
        name: 'margin-y',
        key: 'my',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['margin-top', 'margin-bottom'],
        namespaces: ['spacing']
    },
    {
        name: 'margin',
        key: 'm',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'margin-inline-start',
        key: 'mis',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-inline-end',
        key: 'mie',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-inline',
        key: 'mi',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'margin-block-start',
        key: 'mbs',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-block-end',
        key: 'mbe',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-block',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'padding-left',
        key: 'pl',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-right',
        key: 'pr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-top',
        key: 'pt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-bottom',
        key: 'pb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-x',
        key: 'px',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['padding-left', 'padding-right'],
        namespaces: ['spacing']
    },
    {
        name: 'padding-y',
        key: 'py',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['padding-top', 'padding-bottom'],
        namespaces: ['spacing']
    },
    {
        name: 'padding',
        key: 'p',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'padding-inline-start',
        key: 'pis',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-inline-end',
        key: 'pie',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-inline',
        key: 'pi',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'padding-block-start',
        key: 'pbs',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-block-end',
        key: 'pbe',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-block',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'flex-basis',
        aliasGroups: ['flex'],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'flex-wrap',
        aliasGroups: ['flex'],
        values: ['wrap', 'nowrap', 'wrap-reverse'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'flex-grow',
        aliasGroups: ['flex'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'flex-shrink',
        aliasGroups: ['flex'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'flex-direction',
        aliasGroups: ['flex'],
        values: ['row', 'row-reverse', 'column', 'column-reverse'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'flex',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'display',
        key: 'd',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'width',
        key: 'w',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'height',
        key: 'h',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'inline-size',
        key: 'is',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'block-size',
        key: 'bs',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'min-width',
        key: 'min-w',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'min-height',
        key: 'min-h',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'min-inline-size',
        key: 'min-is',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'min-block-size',
        key: 'min-bs',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'size',
        type: SyntaxRuleType.Shorthand,
        unit: 'rem',
        declarer: 'pair',
        declarerOptions: ['width', 'height']
    },
    {
        name: 'min-size',
        key: 'min',
        type: SyntaxRuleType.Shorthand,
        unit: 'rem',
        declarer: 'pair',
        declarerOptions: ['min-width', 'min-height']
    },
    {
        name: 'max-size',
        key: 'max',
        type: SyntaxRuleType.Shorthand,
        unit: 'rem',
        declarer: 'pair',
        declarerOptions: ['max-width', 'max-height']
    },
    {
        name: 'box-sizing',
        aliasGroups: ['box'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'box-decoration-break',
        key: 'box-decoration',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-box-decoration-break', 'box-decoration-break']
    },
    {
        name: 'container',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'container-name',
        type: SyntaxRuleType.Native
    },
    {
        name: 'container-type',
        type: SyntaxRuleType.Native,
        aliasGroups: ['container'],
        values: ['size', 'inline-size', 'scroll-state'],
    },
    {
        name: 'contain',
        type: SyntaxRuleType.Native
    },
    {
        name: 'contain-intrinsic-inline-size',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'contain-intrinsic-block-size',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'content',
        type: SyntaxRuleType.Native
    },
    {
        name: 'counter-increment',
        type: SyntaxRuleType.Native
    },
    {
        name: 'counter-reset',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'counter-set',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'letter-spacing',
        key: 'tracking',
        subkey: 'ls',
        type: SyntaxRuleType.Native,
        unit: 'em'
    },
    {
        name: 'line-height',
        key: 'leading',
        subkey: 'line-h',
        type: SyntaxRuleType.Native
    },
    {
        name: 'object-fit',
        aliasGroups: ['object', 'obj'],
        values: ['contain', 'cover', 'fill', 'scale-down'],
        type: SyntaxRuleType.Native,
    },
    {
        name: 'object-position',
        aliasGroups: ['object', 'obj'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        type: SyntaxRuleType.Native,
    },
    {
        name: 'text-align',
        aliasGroups: ['text', 't'],
        values: ['justify', 'center', 'left', 'right', 'start', 'end'],
        type: SyntaxRuleType.Native,
    },
    {
        name: 'text-decoration-color',
        aliasGroups: ['text-decoration'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.text']
    },
    {
        name: 'text-decoration-style',
        aliasGroups: ['text-decoration'],
        values: ['solid', 'double', 'dotted', 'dashed', 'wavy'],
        type: SyntaxRuleType.Native,
    },
    {
        name: 'text-decoration-thickness',
        aliasGroups: ['text-decoration'],
        values: ['from-font'],
        kind: 'number',
        type: SyntaxRuleType.Native,
        unit: 'em'
    },
    {
        name: 'text-decoration-line',
        aliasGroups: ['text-decoration'],
        values: ['underline', 'overline', 'line-through'],
        type: SyntaxRuleType.Native,
    },
    {
        name: 'text-decoration',
        aliasGroups: ['text', 't'],
        values: ['underline', 'overline', 'line-through'],
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['color', 'color.text'],
        declarations: ['-webkit-text-decoration', 'text-decoration']
    },
    {
        name: 'text-underline-offset',
        aliasGroups: ['text-underline'],
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'text-underline-position',
        aliasGroups: ['text-underline'],
        values: ['front-font', 'under', 'left', 'right'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'text-overflow',
        aliasGroups: ['text', 't'],
        values: ['ellipsis', 'clip'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'text-orientation',
        aliasGroups: ['text', 't'],
        values: ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'text-transform',
        aliasGroups: ['text', 't'],
        values: ['uppercase', 'lowercase', 'capitalize'],
        type: SyntaxRuleType.Native,
    },
    {
        name: 'text-rendering',
        aliasGroups: ['text', 't'],
        values: ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision'],
        type: SyntaxRuleType.Native,
    },
    {
        name: 'text-wrap',
        aliasGroups: ['text', 't'],
        values: ['wrap', 'nowrap', 'balance', 'pretty'],
        type: SyntaxRuleType.NativeShorthand,
    },
    {
        name: 'text-indent',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'vertical-align',
        key: 'v',
        subkey: 'vertical',
        type: SyntaxRuleType.Native
    },
    {
        name: 'columns',
        key: 'cols',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'overflow-wrap',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'white-space',
        type: SyntaxRuleType.Native
    },
    {
        name: 'top',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'bottom',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'left',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'right',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'inset',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'inset-inline-start',
        key: 'iis',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'inset-inline-end',
        key: 'iie',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'inset-inline',
        key: 'ii',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'inset-block-start',
        key: 'ibs',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'inset-block-end',
        key: 'ibe',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'inset-block',
        key: 'ib',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'max-height',
        key: 'max-h',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'max-width',
        key: 'max-w',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'max-inline-size',
        key: 'max-is',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'max-block-size',
        key: 'max-bs',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'opacity',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'visibility',
        type: SyntaxRuleType.Native
    },
    {
        name: 'clear',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'float',
        type: SyntaxRuleType.Native
    },
    {
        name: 'isolation',
        type: SyntaxRuleType.Native
    },
    {
        name: 'overflow-x',
        type: SyntaxRuleType.Native
    },
    {
        name: 'overflow-y',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'overflow-inline',
        type: SyntaxRuleType.Native
    },
    {
        name: 'overflow-block',
        type: SyntaxRuleType.Native
    },
    {
        name: 'overflow',
        type: SyntaxRuleType.NativeShorthand,
    },
    {
        name: 'overscroll-behavior-x',
        type: SyntaxRuleType.Native
    },
    {
        name: 'overscroll-behavior-y',
        type: SyntaxRuleType.Native
    },
    {
        name: 'overscroll-behavior-inline',
        type: SyntaxRuleType.Native
    },
    {
        name: 'overscroll-behavior-block',
        type: SyntaxRuleType.Native
    },
    {
        name: 'overscroll-behavior',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'z-index',
        key: 'z',
        type: SyntaxRuleType.Native
    },
    {
        name: 'position',
        type: SyntaxRuleType.Native
    },
    {
        name: 'cursor',
        type: SyntaxRuleType.Native
    },
    {
        name: 'pointer-events',
        type: SyntaxRuleType.Native
    },
    {
        name: 'resize',
        type: SyntaxRuleType.Native
    },
    {
        name: 'touch-action',
        key: 'touch',
        type: SyntaxRuleType.Native
    },
    {
        name: 'word-break',
        type: SyntaxRuleType.Native
    },
    {
        name: 'word-spacing',
        type: SyntaxRuleType.Native,
        unit: 'em'
    },
    {
        name: 'hyphens',
        type: SyntaxRuleType.Native
    },
    {
        name: 'user-drag',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-user-drag', 'user-drag']
    },
    {
        name: 'user-select',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-user-select', 'user-select']
    },
    {
        name: 'text-shadow',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    {
        name: 'text-size',
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
    {
        name: 'text-fill-color',
        aliasGroups: ['text', 't'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.text'],
        declarations: ['-webkit-text-fill-color']
    },
    {
        name: 'text-stroke-width',
        aliasGroups: ['text-stroke'],
        values: ['thin', 'medium', 'thick'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-text-stroke-width']
    },
    {
        name: 'text-stroke-color',
        aliasGroups: ['text-stroke'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-text-stroke-color'],
        namespaces: ['color']
    },
    {
        name: 'text-stroke',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-text-stroke']
    },
    {
        name: 'text-truncate',
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
    {
        name: 'box-shadow',
        key: 'shadow',
        subkey: 's',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['shadow', 'color']
    },
    {
        name: 'table-layout',
        type: SyntaxRuleType.Native
    },
    {
        name: 'transform-box',
        aliasGroups: ['transform'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'transform-style',
        aliasGroups: ['transform'],
        values: ['flat', 'preserve-3d'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'transform-origin',
        aliasGroups: ['transform'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        kind: 'number',
        unit: 'px',
        type: SyntaxRuleType.Native
    },
    {
        name: 'transform',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'translate',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scale',
        type: SyntaxRuleType.Native
    },
    {
        name: 'rotate',
        type: SyntaxRuleType.Native,
        unit: 'deg'
    },
    {
        name: 'view-transition-name',
        key: 'vt-name',
        type: SyntaxRuleType.Native
    },
    {
        name: 'view-transition-class',
        key: 'vt-class',
        type: SyntaxRuleType.Native
    },
    {
        name: 'translate()',
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    {
        name: 'translateX()',
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    {
        name: 'translateY()',
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    {
        name: 'translateZ()',
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    {
        name: 'translate3d()',
        declarations: ['transform'],
        unit: 'rem',
        namespaces: ['spacing'],
    },
    {
        name: 'scale()',
        declarations: ['transform']
    },
    {
        name: 'scaleX()',
        declarations: ['transform']
    },
    {
        name: 'scaleY()',
        declarations: ['transform']
    },
    {
        name: 'scaleZ()',
        declarations: ['transform']
    },
    {
        name: 'scale3d()',
        declarations: ['transform']
    },
    {
        name: 'rotate()',
        declarations: ['transform']
    },
    {
        name: 'rotateX()',
        declarations: ['transform']
    },
    {
        name: 'rotateY()',
        declarations: ['transform']
    },
    {
        name: 'rotateZ()',
        declarations: ['transform']
    },
    {
        name: 'rotate3d()',
        declarations: ['transform']
    },
    {
        name: 'skew()',
        declarations: ['transform']
    },
    {
        name: 'skewX()',
        declarations: ['transform']
    },
    {
        name: 'skewY()',
        declarations: ['transform']
    },
    {
        name: 'perspective()',
        declarations: ['transform']
    },
    {
        name: 'matrix()',
        declarations: ['transform']
    },
    {
        name: 'matrix3d()',
        declarations: ['transform']
    },
    {
        name: 'transition-property',
        key: '~property',
        type: SyntaxRuleType.Native
    },
    {
        name: 'transition-timing-function',
        key: '~easing',
        type: SyntaxRuleType.Native,
        namespaces: ['easing']
    },
    {
        name: 'transition-duration',
        key: '~duration',
        type: SyntaxRuleType.Native,
        unit: 'ms',
        namespaces: ['duration']
    },
    {
        name: 'transition-delay',
        key: '~delay',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    },
    {
        name: 'transition',
        sign: '~',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['duration', 'easing']
    },
    {
        name: 'animation-delay',
        key: '@delay',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    },
    {
        name: 'animation-direction',
        key: '@direction',
        type: SyntaxRuleType.Native
    },
    {
        name: 'animation-duration',
        key: '@duration',
        type: SyntaxRuleType.Native,
        unit: 'ms',
        namespaces: ['duration']
    },
    {
        name: 'animation-fill-mode',
        key: '@fill',
        type: SyntaxRuleType.Native
    },
    {
        name: 'animation-iteration-count',
        key: '@iteration',
        type: SyntaxRuleType.Native
    },
    {
        name: 'animation-name',
        key: '@name',
        type: SyntaxRuleType.Native,
        includeAnimations: true
    },
    {
        name: 'animation-play-state',
        key: '@play',
        type: SyntaxRuleType.Native
    },
    {
        name: 'animation-timing-function',
        key: '@easing',
        type: SyntaxRuleType.Native,
        namespaces: ['easing']
    },
    {
        name: 'animation',
        sign: '@',
        type: SyntaxRuleType.NativeShorthand,
        includeAnimations: true,
        namespaces: ['duration', 'easing']
    },
    {
        name: 'border-collapse',
        aliasGroups: ['b', 'border'],
        values: ['collapse', 'separate'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'border-spacing',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'border-top-color',
        aliasGroups: ['bt', 'border-top'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-bottom-color',
        aliasGroups: ['bb', 'border-bottom'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-left-color',
        aliasGroups: ['bl', 'border-left'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-right-color',
        aliasGroups: ['br', 'border-right'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-x-color',
        aliasGroups: ['bx', 'border-x'],
        kind: 'color',
        type: SyntaxRuleType.Shorthand,
        namespaces: ['color', 'color.line'],
        declarations: ['border-left-color', 'border-right-color']
    },
    {
        name: 'border-y-color',
        aliasGroups: ['by', 'border-y'],
        kind: 'color',
        type: SyntaxRuleType.Shorthand,
        namespaces: ['color', 'color.line'],
        declarations: ['border-top-color', 'border-bottom-color']
    },
    {
        name: 'border-color',
        aliasGroups: ['b', 'border'],
        kind: 'color',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-top-left-radius',
        key: 'rtl',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['border-radius']
    },
    {
        name: 'border-top-right-radius',
        key: 'rtr',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['border-radius']
    },
    {
        name: 'border-bottom-left-radius',
        key: 'rbl',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['border-radius']
    },
    {
        name: 'border-bottom-right-radius',
        key: 'rbr',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['border-radius']
    },
    {
        name: 'border-top-radius',
        key: 'rt',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-left-radius', 'border-top-right-radius'],
        namespaces: ['border-radius']
    },
    {
        name: 'border-bottom-radius',
        key: 'rb',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-bottom-left-radius', 'border-bottom-right-radius'],
        namespaces: ['border-radius']
    },
    {
        name: 'border-left-radius',
        key: 'rl',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-left-radius', 'border-bottom-left-radius'],
        namespaces: ['border-radius']
    },
    {
        name: 'border-right-radius',
        key: 'rr',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-right-radius', 'border-bottom-right-radius'],
        namespaces: ['border-radius']
    },
    {
        name: 'border-radius',
        key: 'r',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'border-top-style',
        aliasGroups: ['bt', 'border-top'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    {
        name: 'border-bottom-style',
        aliasGroups: ['bb', 'border-bottom'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    {
        name: 'border-left-style',
        aliasGroups: ['bl', 'border-left'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    {
        name: 'border-right-style',
        aliasGroups: ['br', 'border-right'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    {
        name: 'border-x-style',
        aliasGroups: ['bx', 'border-x'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-left-style', 'border-right-style']
    },
    {
        name: 'border-y-style',
        aliasGroups: ['by', 'border-y'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-style', 'border-bottom-style']
    },
    {
        name: 'border-style',
        aliasGroups: ['b', 'border'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'border-top-width',
        aliasGroups: ['bt', 'border-top'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'border-bottom-width',
        aliasGroups: ['bb', 'border-bottom'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'border-left-width',
        aliasGroups: ['bl', 'border-left'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'border-right-width',
        aliasGroups: ['br', 'border-right'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    {
        name: 'border-x-width',
        aliasGroups: ['bx', 'border-x'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-left-width', 'border-right-width']
    },
    {
        name: 'border-y-width',
        aliasGroups: ['by', 'border-y'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['border-top-width', 'border-bottom-width']
    },
    {
        name: 'border-width',
        aliasGroups: ['b', 'border'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'border-image-repeat',
        aliasGroups: ['border-image'],
        values: ['stretch', 'repeat', 'round', 'space'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'border-image-slice',
        aliasGroups: ['border-image'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'border-image-source',
        aliasGroups: ['border-image'],
        kind: 'image',
        type: SyntaxRuleType.Native
    },
    {
        name: 'border-image-width',
        aliasGroups: ['border-image'],
        values: ['auto'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'border-image-outset',
        aliasGroups: ['border-image'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'border-image',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'border-top',
        key: 'bt',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-bottom',
        key: 'bb',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-left',
        key: 'bl',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-right',
        key: 'br',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-x',
        key: 'bx',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
        declarations: ['border-left', 'border-right']
    },
    {
        name: 'border-y',
        key: 'by',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
        declarations: ['border-top', 'border-bottom']
    },
    {
        name: 'border',
        key: 'b',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        transformer: 'auto-fill-solid',
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'border-inline-start-color', kind: 'color', type: SyntaxRuleType.Native, namespaces: ['color', 'color.line'] },
    {
        name: 'border-inline-end-color', kind: 'color', type: SyntaxRuleType.Native, namespaces: ['color', 'color.line'] },
    {
        name: 'border-block-start-color', kind: 'color', type: SyntaxRuleType.Native, namespaces: ['color', 'color.line'] },
    {
        name: 'border-block-end-color', kind: 'color', type: SyntaxRuleType.Native, namespaces: ['color', 'color.line'] },
    {
        name: 'border-inline-color', kind: 'color', type: SyntaxRuleType.NativeShorthand, namespaces: ['color', 'color.line'] },
    {
        name: 'border-block-color', kind: 'color', type: SyntaxRuleType.NativeShorthand, namespaces: ['color', 'color.line'] },
    {
        name: 'border-inline-start-style', values: BORDER_STYLE_VALUES, type: SyntaxRuleType.Native },
    {
        name: 'border-inline-end-style', values: BORDER_STYLE_VALUES, type: SyntaxRuleType.Native },
    {
        name: 'border-block-start-style', values: BORDER_STYLE_VALUES, type: SyntaxRuleType.Native },
    {
        name: 'border-block-end-style', values: BORDER_STYLE_VALUES, type: SyntaxRuleType.Native },
    {
        name: 'border-inline-style', values: BORDER_STYLE_VALUES, type: SyntaxRuleType.NativeShorthand },
    {
        name: 'border-block-style', values: BORDER_STYLE_VALUES, type: SyntaxRuleType.NativeShorthand },
    {
        name: 'border-inline-start-width', kind: 'number', unit: 'rem', type: SyntaxRuleType.Native },
    {
        name: 'border-inline-end-width', kind: 'number', unit: 'rem', type: SyntaxRuleType.Native },
    {
        name: 'border-block-start-width', kind: 'number', unit: 'rem', type: SyntaxRuleType.Native },
    {
        name: 'border-block-end-width', kind: 'number', unit: 'rem', type: SyntaxRuleType.Native },
    {
        name: 'border-inline-width', kind: 'number', unit: 'rem', type: SyntaxRuleType.NativeShorthand },
    {
        name: 'border-block-width', kind: 'number', unit: 'rem', type: SyntaxRuleType.NativeShorthand },
    {
        name: 'border-inline-start', unit: 'rem', type: SyntaxRuleType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color', 'color.line'] },
    {
        name: 'border-inline-end', unit: 'rem', type: SyntaxRuleType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color', 'color.line'] },
    {
        name: 'border-block-start', unit: 'rem', type: SyntaxRuleType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color', 'color.line'] },
    {
        name: 'border-block-end', unit: 'rem', type: SyntaxRuleType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color', 'color.line'] },
    {
        name: 'border-inline', unit: 'rem', type: SyntaxRuleType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color', 'color.line'] },
    {
        name: 'border-block', unit: 'rem', type: SyntaxRuleType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color', 'color.line'] },
    {
        name: 'border-start-start-radius', unit: 'rem', type: SyntaxRuleType.Native, namespaces: ['border-radius'] },
    {
        name: 'border-start-end-radius', unit: 'rem', type: SyntaxRuleType.Native, namespaces: ['border-radius'] },
    {
        name: 'border-end-start-radius', unit: 'rem', type: SyntaxRuleType.Native, namespaces: ['border-radius'] },
    {
        name: 'border-end-end-radius', unit: 'rem', type: SyntaxRuleType.Native, namespaces: ['border-radius'] },
    {
        name: 'background-attachment',
        aliasGroups: ['bg'],
        values: ['fixed', 'local', 'scroll'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'background-blend-mode',
        key: 'bg-blend',
        type: SyntaxRuleType.Native
    },
    {
        name: 'background-color',
        aliasGroups: ['bg'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    {
        name: 'background-clip',
        key: 'bg-clip',
        type: SyntaxRuleType.Native
    },
    {
        name: 'background-origin',
        key: 'bg-origin',
        type: SyntaxRuleType.Native
    },
    {
        name: 'background-position',
        aliasGroups: ['bg'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        type: SyntaxRuleType.Native,
        unit: 'px'
    },
    {
        name: 'background-repeat',
        aliasGroups: ['bg'],
        values: ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'background-size',
        aliasGroups: ['bg'],
        values: ['auto', 'cover', 'contain'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'background-image',
        aliasGroups: ['bg'],
        kind: 'image',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    {
        name: 'background',
        key: 'bg',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['color']
    },
    {
        name: 'gradient()',
        declarations: {
            'background-image': ['linear-', undefined]
        },
        namespaces: ['color']
    },
    {
        name: 'mix-blend-mode',
        key: 'blend',
        type: SyntaxRuleType.Native
    },
    {
        name: 'backdrop-filter',
        key: 'bd',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-backdrop-filter', 'backdrop-filter'],
        namespaces: ['color']
    },
    {
        name: 'filter',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    {
        name: 'blur()',
        declarations: ['filter']
    },
    {
        name: 'brightness()',
        declarations: ['filter']
    },
    {
        name: 'contrast()',
        declarations: ['filter']
    },
    {
        name: 'drop-shadow()',
        declarations: ['filter'],
        namespaces: ['color']
    },
    {
        name: 'grayscale()',
        declarations: ['filter']
    },
    {
        name: 'hue-rotate()',
        declarations: ['filter']
    },
    {
        name: 'invert()',
        declarations: ['filter']
    },
    {
        name: 'opacity()',
        declarations: ['filter']
    },
    {
        name: 'saturate()',
        declarations: ['filter']
    },
    {
        name: 'sepia()',
        declarations: ['filter']
    },
    {
        name: 'fill',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    {
        name: 'stroke-dasharray',
        type: SyntaxRuleType.Native
    },
    {
        name: 'stroke-dashoffset',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'stroke-width',
        aliasGroups: ['stroke'],
        kind: 'number',
        type: SyntaxRuleType.Native
    },
    {
        name: 'stroke',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    {
        name: 'x',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'y',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'cx',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'cy',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'rx',
        type: SyntaxRuleType.Native
    },
    {
        name: 'ry',
        type: SyntaxRuleType.Native
    },
    {
        name: 'grid-column-start',
        key: 'grid-col-start',
        type: SyntaxRuleType.Native
    },
    {
        name: 'grid-column-end',
        key: 'grid-col-end',
        type: SyntaxRuleType.Native
    },
    {
        name: 'grid-column-span',
        key: 'grid-col-span',
        type: SyntaxRuleType.Shorthand,
        declarations: {
            'grid-column': ['span ', undefined, '/span ', undefined]
        }
    },
    {
        name: 'grid-column',
        key: 'grid-col',
        type: SyntaxRuleType.NativeShorthand,
    },
    {
        name: 'grid-columns',
        key: 'grid-cols',
        declarations: {
            display: 'grid',
            'grid-template-columns': ['repeat(', undefined, ',minmax(0,1fr))'],
        },
        type: SyntaxRuleType.Shorthand
    },
    {
        name: 'grid-row-start',
        type: SyntaxRuleType.Native
    },
    {
        name: 'grid-row-end',
        type: SyntaxRuleType.Native
    },
    {
        name: 'grid-row-span',
        type: SyntaxRuleType.Shorthand,
        declarations: {
            'grid-row': ['span ', undefined, '/span ', undefined]
        }
    },
    {
        name: 'grid-row',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'grid-rows',
        declarations: {
            display: 'grid',
            'grid-auto-flow': 'column',
            'grid-template-rows': ['repeat(', undefined, ',minmax(0,1fr))'],
        },
        type: SyntaxRuleType.Shorthand
    },
    {
        name: 'grid-auto-columns',
        key: 'grid-auto-cols',
        type: SyntaxRuleType.Native
    },
    {
        name: 'grid-auto-flow',
        key: 'grid-flow',
        type: SyntaxRuleType.Native
    },
    {
        name: 'grid-auto-rows',
        type: SyntaxRuleType.Native
    },
    {
        name: 'grid-template-areas',
        type: SyntaxRuleType.Native
    },
    {
        name: 'grid-template-columns',
        key: 'grid-template-cols',
        type: SyntaxRuleType.Native,
        unit: 'rem'
    },
    {
        name: 'grid-template-rows',
        type: SyntaxRuleType.Native,
        unit: 'rem'
    },
    {
        name: 'grid-template',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'grid-area',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'grid',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'column-gap',
        key: 'gap-x',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'row-gap',
        key: 'gap-y',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'gap',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'order',
        key: 'o',
        type: SyntaxRuleType.Native
    },
    {
        name: 'break-inside',
        type: SyntaxRuleType.Native
    },
    {
        name: 'break-before',
        type: SyntaxRuleType.Native
    },
    {
        name: 'break-after',
        type: SyntaxRuleType.Native
    },
    {
        name: 'aspect-ratio',
        key: 'aspect',
        type: SyntaxRuleType.Native
    },
    {
        name: 'column-span',
        key: 'col-span',
        type: SyntaxRuleType.Native
    },
    {
        name: 'align-content',
        subkey: 'ac',
        type: SyntaxRuleType.Native
    },
    {
        name: 'align-items',
        subkey: 'ai',
        type: SyntaxRuleType.Native
    },
    {
        name: 'align-self',
        subkey: 'as',
        type: SyntaxRuleType.Native
    },
    {
        name: 'justify-content',
        subkey: 'jc',
        type: SyntaxRuleType.Native
    },
    {
        name: 'justify-items',
        subkey: 'ji',
        type: SyntaxRuleType.Native
    },
    {
        name: 'justify-self',
        subkey: 'js',
        type: SyntaxRuleType.Native
    },
    {
        name: 'place-content',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'place-items',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'place-self',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'list-style-position',
        aliasGroups: ['list-style'],
        values: ['inside', 'outside'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'list-style-type',
        aliasGroups: ['list-style'],
        values: ['disc', 'decimal'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'list-style-image',
        aliasGroups: ['list-style'],
        kind: 'image',
        type: SyntaxRuleType.Native
    },
    {
        name: 'list-style',
        type: SyntaxRuleType.NativeShorthand
    },
    {
        name: 'outline-color',
        aliasGroups: ['outline'],
        kind: 'color',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.line'],
    },
    {
        name: 'outline-offset',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'outline-style',
        aliasGroups: ['outline'],
        values: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native
    },
    {
        name: 'outline-width',
        aliasGroups: ['outline'],
        values: ['medium', 'thick', 'thin'],
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    {
        name: 'outline',
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
    {
        name: 'accent-color',
        key: 'accent',
        type: SyntaxRuleType.Native,
        namespaces: ['color']
    },
    {
        name: 'appearance',
        type: SyntaxRuleType.Native
    },
    {
        name: 'caret-color',
        key: 'caret',
        type: SyntaxRuleType.Native,
        namespaces: ['color', 'color.text']
    },
    {
        name: 'scroll-behavior',
        type: SyntaxRuleType.Native
    },
    {
        name: 'scroll-margin-left',
        key: 'scroll-ml',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-right',
        key: 'scroll-mr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-top',
        key: 'scroll-mt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-bottom',
        key: 'scroll-mb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-x',
        key: 'scroll-mx',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['scroll-margin-left', 'scroll-margin-right'],
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-y',
        key: 'scroll-my',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['scroll-margin-top', 'scroll-margin-bottom'],
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin',
        key: 'scroll-m',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-left',
        key: 'scroll-pl',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-right',
        key: 'scroll-pr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-top',
        key: 'scroll-pt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-bottom',
        key: 'scroll-pb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-x',
        key: 'scroll-px',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['scroll-padding-left', 'scroll-padding-right'],
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-y',
        key: 'scroll-py',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declarations: ['scroll-padding-top', 'scroll-padding-bottom'],
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding',
        key: 'scroll-p',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'scroll-snap-align',
        aliasGroups: ['scroll-snap'],
        values: ['start', 'end', 'center'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'scroll-snap-stop',
        aliasGroups: ['scroll-snap'],
        values: ['normal', 'always'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'scroll-snap-type',
        aliasGroups: ['scroll-snap'],
        values: ['x', 'y', 'block', 'inline', 'both'],
        type: SyntaxRuleType.Native
    },
    {
        name: 'will-change',
        type: SyntaxRuleType.Native
    },
    {
        name: 'writing-mode',
        key: 'writing',
        type: SyntaxRuleType.Native
    },
    {
        name: 'direction',
        type: SyntaxRuleType.Native
    },
    {
        name: 'shape-outside',
        key: 'shape',
        type: SyntaxRuleType.Native
    },
    {
        name: 'shape-margin',
        kind: 'number',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'shape-image-threshold',
        type: SyntaxRuleType.Native
    },
    {
        name: 'clip-path',
        key: 'clip',
        type: SyntaxRuleType.Native
    },
    {
        name: 'quotes',
        type: SyntaxRuleType.Native
    },
    {
        name: 'mask-image',
        type: SyntaxRuleType.Native,
        declarations: ['-webkit-mask-image', 'mask-image']
    },
    {
        name: 'group',
        matcher: '^\\{.+?\\}',
        type: SyntaxRuleType.Shorthand,
        declarer: 'core.group'
    },
    {
        name: 'variable',
        matcher: '^\\$[\\w-]+:', // don't use 'rem' as default, because css variable is common API
        type: SyntaxRuleType.Shorthand,
        declarer: 'core.variable'
    }
] satisfies SyntaxRuleDefinitions

export default rules
