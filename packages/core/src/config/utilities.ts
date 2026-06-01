import UtilityType from '../utility-type'
import { BORDER_STYLE_VALUES } from '../common'
import type { UtilityDefinitions } from '../types/config'

const utilities = [
    {
        name: 'container',
        type: UtilityType.Static,
        declarations: { 'container-type': 'inline-size' }
    },
    {
        name: 'square',
        type: UtilityType.Static,
        declarations: { 'aspect-ratio': '1/1' }
    },
    {
        name: 'video',
        type: UtilityType.Static,
        declarations: { 'aspect-ratio': '16/9' }
    },
    {
        name: 'rounded',
        type: UtilityType.Static,
        declarations: { 'border-radius': '1e9em' }
    },
    {
        name: 'round',
        type: UtilityType.Static,
        declarations: { 'border-radius': '50%', 'aspect-ratio': '1/1' }
    },
    {
        name: 'hidden',
        type: UtilityType.Static,
        declarations: { 'display': 'none' }
    },
    {
        name: 'block',
        type: UtilityType.Static,
        declarations: { 'display': 'block' }
    },
    {
        name: 'table',
        type: UtilityType.Static,
        declarations: { 'display': 'table' }
    },
    {
        name: 'flex',
        type: UtilityType.Static,
        declarations: { 'display': 'flex' }
    },
    {
        name: 'grid',
        type: UtilityType.Static,
        declarations: { 'display': 'grid' }
    },
    {
        name: 'contents',
        type: UtilityType.Static,
        declarations: { 'display': 'contents' }
    },
    {
        name: 'inline',
        type: UtilityType.Static,
        declarations: { 'display': 'inline' }
    },
    {
        name: 'inline-block',
        type: UtilityType.Static,
        declarations: { 'display': 'inline-block' }
    },
    {
        name: 'inline-flex',
        type: UtilityType.Static,
        declarations: { 'display': 'inline-flex' }
    },
    {
        name: 'inline-grid',
        type: UtilityType.Static,
        declarations: { 'display': 'inline-grid' }
    },
    {
        name: 'inline-table',
        type: UtilityType.Static,
        declarations: { 'display': 'inline-table' }
    },
    {
        name: 'table-cell',
        type: UtilityType.Static,
        declarations: { 'display': 'table-cell' }
    },
    {
        name: 'table-caption',
        type: UtilityType.Static,
        declarations: { 'display': 'table-caption' }
    },
    {
        name: 'flow-root',
        type: UtilityType.Static,
        declarations: { 'display': 'flow-root' }
    },
    {
        name: 'list-item',
        type: UtilityType.Static,
        declarations: { 'display': 'list-item' }
    },
    {
        name: 'table-row',
        type: UtilityType.Static,
        declarations: { 'display': 'table-row' }
    },
    {
        name: 'table-column',
        type: UtilityType.Static,
        declarations: { 'display': 'table-column' }
    },
    {
        name: 'table-row-group',
        type: UtilityType.Static,
        declarations: { 'display': 'table-row-group' }
    },
    {
        name: 'table-column-group',
        type: UtilityType.Static,
        declarations: { 'display': 'table-column-group' }
    },
    {
        name: 'table-header-group',
        type: UtilityType.Static,
        declarations: { 'display': 'table-header-group' }
    },
    {
        name: 'table-footer-group',
        type: UtilityType.Static,
        declarations: { 'display': 'table-footer-group' }
    },
    {
        name: 'italic',
        type: UtilityType.Static,
        declarations: { 'font-style': 'italic' }
    },
    {
        name: 'oblique',
        type: UtilityType.Static,
        declarations: { 'font-style': 'oblique' }
    },
    {
        name: 'isolate',
        type: UtilityType.Static,
        declarations: { 'isolation': 'isolate' }
    },
    {
        name: 'overflow',
        type: UtilityType.Static,
        declarations: { 'overflow': 'visible' }
    },
    {
        name: 'untouchable',
        type: UtilityType.Static,
        declarations: { 'pointer-events': 'none' }
    },
    {
        name: 'static',
        type: UtilityType.Static,
        declarations: { 'position': 'static' }
    },
    {
        name: 'fixed',
        type: UtilityType.Static,
        declarations: { 'position': 'fixed' }
    },
    {
        name: 'abs',
        type: UtilityType.Static,
        declarations: { 'position': 'absolute' }
    },
    {
        name: 'rel',
        type: UtilityType.Static,
        declarations: { 'position': 'relative' }
    },
    {
        name: 'sticky',
        type: UtilityType.Static,
        declarations: { 'position': 'sticky' }
    },
    {
        name: 'uppercase',
        type: UtilityType.Static,
        declarations: { 'text-transform': 'uppercase' }
    },
    {
        name: 'lowercase',
        type: UtilityType.Static,
        declarations: { 'text-transform': 'lowercase' }
    },
    {
        name: 'capitalize',
        type: UtilityType.Static,
        declarations: { 'text-transform': 'capitalize' }
    },
    {
        name: 'visible',
        type: UtilityType.Static,
        declarations: { 'visibility': 'visible' }
    },
    {
        name: 'invisible',
        type: UtilityType.Static,
        declarations: { 'visibility': 'hidden' }
    },
    {
        name: 'justify-normal',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'normal' }
    },
    {
        name: 'justify-left',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'left' }
    },
    {
        name: 'justify-center',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'center' }
    },
    {
        name: 'justify-right',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'right' }
    },
    {
        name: 'justify-stretch',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'stretch' }
    },
    {
        name: 'justify-start',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'start' }
    },
    {
        name: 'justify-end',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'end' }
    },
    {
        name: 'justify-flex-start',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'flex-start' }
    },
    {
        name: 'justify-flex-end',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'flex-end' }
    },
    {
        name: 'justify-around',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'space-around' }
    },
    {
        name: 'justify-between',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'space-between' }
    },
    {
        name: 'justify-evenly',
        type: UtilityType.Static,
        declarations: { 'justify-content': 'space-evenly' }
    },
    {
        name: 'content-normal',
        type: UtilityType.Static,
        declarations: { 'align-content': 'normal' }
    },
    {
        name: 'content-baseline',
        type: UtilityType.Static,
        declarations: { 'align-content': 'baseline' }
    },
    {
        name: 'content-center',
        type: UtilityType.Static,
        declarations: { 'align-content': 'center' }
    },
    {
        name: 'content-stretch',
        type: UtilityType.Static,
        declarations: { 'align-content': 'stretch' }
    },
    {
        name: 'content-start',
        type: UtilityType.Static,
        declarations: { 'align-content': 'start' }
    },
    {
        name: 'content-end',
        type: UtilityType.Static,
        declarations: { 'align-content': 'end' }
    },
    {
        name: 'content-flex-start',
        type: UtilityType.Static,
        declarations: { 'align-content': 'flex-start' }
    },
    {
        name: 'content-flex-end',
        type: UtilityType.Static,
        declarations: { 'align-content': 'flex-end' }
    },
    {
        name: 'content-around',
        type: UtilityType.Static,
        declarations: { 'align-content': 'space-around' }
    },
    {
        name: 'content-between',
        type: UtilityType.Static,
        declarations: { 'align-content': 'space-between' }
    },
    {
        name: 'content-evenly',
        type: UtilityType.Static,
        declarations: { 'align-content': 'space-evenly' }
    },
    {
        name: 'items-normal',
        type: UtilityType.Static,
        declarations: { 'align-items': 'normal' }
    },
    {
        name: 'items-baseline',
        type: UtilityType.Static,
        declarations: { 'align-items': 'baseline' }
    },
    {
        name: 'items-center',
        type: UtilityType.Static,
        declarations: { 'align-items': 'center' }
    },
    {
        name: 'items-stretch',
        type: UtilityType.Static,
        declarations: { 'align-items': 'stretch' }
    },
    {
        name: 'items-start',
        type: UtilityType.Static,
        declarations: { 'align-items': 'start' }
    },
    {
        name: 'items-end',
        type: UtilityType.Static,
        declarations: { 'align-items': 'end' }
    },
    {
        name: 'items-flex-start',
        type: UtilityType.Static,
        declarations: { 'align-items': 'flex-start' }
    },
    {
        name: 'items-flex-end',
        type: UtilityType.Static,
        declarations: { 'align-items': 'flex-end' }
    },
    {
        name: 'items-self-start',
        type: UtilityType.Static,
        declarations: { 'align-items': 'self-start' }
    },
    {
        name: 'items-self-end',
        type: UtilityType.Static,
        declarations: { 'align-items': 'self-end' }
    },
    {
        name: 'self-auto',
        type: UtilityType.Static,
        declarations: { 'align-self': 'auto' }
    },
    {
        name: 'self-normal',
        type: UtilityType.Static,
        declarations: { 'align-self': 'normal' }
    },
    {
        name: 'self-baseline',
        type: UtilityType.Static,
        declarations: { 'align-self': 'baseline' }
    },
    {
        name: 'self-center',
        type: UtilityType.Static,
        declarations: { 'align-self': 'center' }
    },
    {
        name: 'self-stretch',
        type: UtilityType.Static,
        declarations: { 'align-self': 'stretch' }
    },
    {
        name: 'self-start',
        type: UtilityType.Static,
        declarations: { 'align-self': 'start' }
    },
    {
        name: 'self-end',
        type: UtilityType.Static,
        declarations: { 'align-self': 'end' }
    },
    {
        name: 'self-flex-start',
        type: UtilityType.Static,
        declarations: { 'align-self': 'flex-start' }
    },
    {
        name: 'self-flex-end',
        type: UtilityType.Static,
        declarations: { 'align-self': 'flex-end' }
    },
    {
        name: 'self-self-start',
        type: UtilityType.Static,
        declarations: { 'align-self': 'self-start' }
    },
    {
        name: 'self-self-end',
        type: UtilityType.Static,
        declarations: { 'align-self': 'self-end' }
    },
    {
        name: 'self-anchor-center',
        type: UtilityType.Static,
        declarations: { 'align-self': 'anchor-center' }
    },
    {
        name: 'vw',
        type: UtilityType.Static,
        declarations: { 'width': '100vw' }
    },
    {
        name: 'vh',
        type: UtilityType.Static,
        declarations: { 'height': '100vh' }
    },
    {
        name: 'box-border',
        type: UtilityType.Static,
        declarations: { 'box-sizing': 'border-box' }
    },
    {
        name: 'box-content',
        type: UtilityType.Static,
        declarations: { 'box-sizing': 'content-box' }
    },
    {
        name: 'transform-content',
        type: UtilityType.Static,
        declarations: { 'transform-box': 'content-box' }
    },
    {
        name: 'transform-border',
        type: UtilityType.Static,
        declarations: { 'transform-box': 'border-box' }
    },
    {
        name: 'transform-fill',
        type: UtilityType.Static,
        declarations: { 'transform-box': 'fill-box' }
    },
    {
        name: 'transform-stroke',
        type: UtilityType.Static,
        declarations: { 'transform-box': 'stroke-box' }
    },
    {
        name: 'transform-view',
        type: UtilityType.Static,
        declarations: { 'transform-box': 'view-box' }
    },
    {
        name: 'bg-clip-content',
        type: UtilityType.Static,
        declarations: { 'background-clip': 'content-box' }
    },
    {
        name: 'bg-clip-padding',
        type: UtilityType.Static,
        declarations: { 'background-clip': 'padding-box' }
    },
    {
        name: 'bg-clip-border',
        type: UtilityType.Static,
        declarations: { 'background-clip': 'border-box' }
    },
    {
        name: 'bg-clip-text',
        type: UtilityType.Static,
        declarations: { 'background-clip': 'text' }
    },
    {
        name: 'bg-origin-content',
        type: UtilityType.Static,
        declarations: { 'background-origin': 'content-box' }
    },
    {
        name: 'bg-origin-padding',
        type: UtilityType.Static,
        declarations: { 'background-origin': 'padding-box' }
    },
    {
        name: 'bg-origin-border',
        type: UtilityType.Static,
        declarations: { 'background-origin': 'border-box' }
    },
    {
        name: 'shape-none',
        type: UtilityType.Static,
        declarations: { 'shape-outside': 'none' }
    },
    {
        name: 'shape-margin',
        type: UtilityType.Static,
        declarations: { 'shape-outside': 'margin-box' }
    },
    {
        name: 'shape-content',
        type: UtilityType.Static,
        declarations: { 'shape-outside': 'content-box' }
    },
    {
        name: 'shape-border',
        type: UtilityType.Static,
        declarations: { 'shape-outside': 'border-box' }
    },
    {
        name: 'shape-padding',
        type: UtilityType.Static,
        declarations: { 'shape-outside': 'padding-box' }
    },
    {
        name: 'clip-none',
        type: UtilityType.Static,
        declarations: { 'clip-path': 'none' }
    },
    {
        name: 'clip-margin',
        type: UtilityType.Static,
        declarations: { 'clip-path': 'margin-box' }
    },
    {
        name: 'clip-content',
        type: UtilityType.Static,
        declarations: { 'clip-path': 'content-box' }
    },
    {
        name: 'clip-border',
        type: UtilityType.Static,
        declarations: { 'clip-path': 'border-box' }
    },
    {
        name: 'clip-padding',
        type: UtilityType.Static,
        declarations: { 'clip-path': 'padding-box' }
    },
    {
        name: 'clip-fill',
        type: UtilityType.Static,
        declarations: { 'clip-path': 'fill-box' }
    },
    {
        name: 'clip-stroke',
        type: UtilityType.Static,
        declarations: { 'clip-path': 'stroke-box' }
    },
    {
        name: 'clip-view',
        type: UtilityType.Static,
        declarations: { 'clip-path': 'view-box' }
    },
    {
        name: 'flex-row',
        type: UtilityType.Static,
        declarations: { 'flex-direction': 'row' }
    },
    {
        name: 'flex-row-reverse',
        type: UtilityType.Static,
        declarations: { 'flex-direction': 'row-reverse' }
    },
    {
        name: 'flex-col',
        type: UtilityType.Static,
        declarations: { 'flex-direction': 'column' }
    },
    {
        name: 'flex-col-reverse',
        type: UtilityType.Static,
        declarations: { 'flex-direction': 'column-reverse' }
    },
    {
        name: 'max-vw',
        type: UtilityType.Static,
        declarations: { 'max-width': '100vw' }
    },
    {
        name: 'max-vh',
        type: UtilityType.Static,
        declarations: { 'max-height': '100vh' }
    },
    {
        name: 'min-vw',
        type: UtilityType.Static,
        declarations: { 'min-width': '100vw' }
    },
    {
        name: 'min-vh',
        type: UtilityType.Static,
        declarations: { 'min-height': '100vh' }
    },
    {
        name: 'full',
        type: UtilityType.Static,
        declarations: { 'width': '100%', 'height': '100%' }
    },
    {
        name: 'top',
        type: UtilityType.Static,
        declarations: { 'top': 0 }
    },
    {
        name: 'left',
        type: UtilityType.Static,
        declarations: { 'left': 0 }
    },
    {
        name: 'right',
        type: UtilityType.Static,
        declarations: { 'right': 0 }
    },
    {
        name: 'bottom',
        type: UtilityType.Static,
        declarations: { 'bottom': 0 }
    },
    {
        name: 'center',
        type: UtilityType.Static,
        declarations: { 'left': 0, 'right': 0, 'margin-left': 'auto', 'margin-right': 'auto' }
    },
    {
        name: 'middle',
        type: UtilityType.Static,
        declarations: { 'top': 0, 'bottom': 0, 'margin-top': 'auto', 'margin-bottom': 'auto' }
    },
    {
        name: 'break-spaces',
        type: UtilityType.Static,
        declarations: { 'white-space': 'break-spaces' }
    },
    {
        name: 'break-word',
        type: UtilityType.Static,
        declarations: { 'word-break': 'break-word' }
    },
    {
        name: 'wrap-break-word',
        type: UtilityType.Static,
        declarations: { 'overflow-wrap': 'break-word' }
    },
    {
        name: 'wrap-anywhere',
        type: UtilityType.Static,
        declarations: { 'overflow-wrap': 'anywhere' }
    },
    {
        name: 'wrap-normal',
        type: UtilityType.Static,
        declarations: { 'overflow-wrap': 'normal' }
    },
    {
        name: 'gradient-text',
        type: UtilityType.Static,
        declarations: { '-webkit-text-fill-color': 'transparent', 'background-clip': 'text' }
    },
    {
        name: 'fit',
        type: UtilityType.Static,
        declarations: { 'width': 'fit-content', 'height': 'fit-content' }
    },
    {
        name: 'font-antialiased',
        type: UtilityType.Static,
        declarations: { '-webkit-font-smoothing': 'antialiased', '-moz-osx-font-smoothing': 'grayscale' }
    },
    {
        name: 'font-subpixel-antialiased',
        type: UtilityType.Static,
        declarations: { '-webkit-font-smoothing': 'auto', '-moz-osx-font-smoothing': 'auto' }
    },
    {
        name: 'sr-only',
        type: UtilityType.Static,
        declarations: { 'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0', 'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0,0,0,0)', 'white-space': 'nowrap', 'border-width': '0' }
    },
    {
        name: 'font-size',
        aliasGroups: ['font', 'f'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'font-weight',
        aliasGroups: ['font', 'f'],
        values: ['bolder'],
        type: UtilityType.Native
    },
    {
        name: 'font-family',
        aliasGroups: ['font', 'f'],
        type: UtilityType.Native
    },
    {
        name: 'font-smooth',
        type: UtilityType.Native
    },
    {
        name: 'font-style',
        aliasGroups: ['font', 'f'],
        values: ['normal', 'italic', 'oblique'],
        type: UtilityType.Native,
        unit: 'deg'
    },
    {
        name: 'font-variant-numeric',
        aliasGroups: ['font', 'f'],
        values: ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions'],
        type: UtilityType.Native
    },
    {
        name: 'font-variant',
        aliasGroups: ['font', 'f'],
        type: UtilityType.NativeShorthand,
    },
    {
        name: 'font',
        subkey: 'f',
        type: UtilityType.NativeShorthand,
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
        type: UtilityType.Native
    },
    {
        name: 'color',
        key: 'fg',
        type: UtilityType.Native,
        namespaces: ['color-text', 'color']
    },
    {
        name: 'margin-left',
        key: 'ml',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-right',
        key: 'mr',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-top',
        key: 'mt',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-bottom',
        key: 'mb',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-x',
        key: 'mx',
        subkey: 'margin-x',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['margin-left', 'margin-right'],
        namespaces: ['spacing']
    },
    {
        name: 'margin-y',
        key: 'my',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['margin-top', 'margin-bottom'],
        namespaces: ['spacing']
    },
    {
        name: 'margin',
        key: 'm',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'margin-inline-start',
        key: 'mis',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-inline-end',
        key: 'mie',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-inline',
        key: 'mi',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'margin-block-start',
        key: 'mbs',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-block-end',
        key: 'mbe',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'margin-block',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'padding-left',
        key: 'pl',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-right',
        key: 'pr',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-top',
        key: 'pt',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-bottom',
        key: 'pb',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-x',
        key: 'px',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['padding-left', 'padding-right'],
        namespaces: ['spacing']
    },
    {
        name: 'padding-y',
        key: 'py',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['padding-top', 'padding-bottom'],
        namespaces: ['spacing']
    },
    {
        name: 'padding',
        key: 'p',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'padding-inline-start',
        key: 'pis',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-inline-end',
        key: 'pie',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-inline',
        key: 'pi',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'padding-block-start',
        key: 'pbs',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-block-end',
        key: 'pbe',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'padding-block',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'flex-basis',
        aliasGroups: ['flex'],
        unit: 'rem',
        type: UtilityType.Native,
    },
    {
        name: 'flex-wrap',
        aliasGroups: ['flex'],
        values: ['wrap', 'nowrap', 'wrap-reverse'],
        type: UtilityType.Native
    },
    {
        name: 'flex-grow',
        aliasGroups: ['flex'],
        type: UtilityType.Native
    },
    {
        name: 'flex-shrink',
        aliasGroups: ['flex'],
        type: UtilityType.Native
    },
    {
        name: 'flex-direction',
        aliasGroups: ['flex'],
        values: ['row', 'row-reverse', 'column', 'column-reverse'],
        type: UtilityType.Native
    },
    {
        name: 'flex',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'display',
        key: 'd',
        type: UtilityType.Native,
    },
    {
        name: 'width',
        key: 'w',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'height',
        key: 'h',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'inline-size',
        key: 'is',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'block-size',
        key: 'bs',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'min-width',
        key: 'min-w',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'min-height',
        key: 'min-h',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'min-inline-size',
        key: 'min-is',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'min-block-size',
        key: 'min-bs',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'size',
        type: UtilityType.Shorthand,
        unit: 'rem',
        declarer: 'pair',
        declarerOptions: ['width', 'height']
    },
    {
        name: 'min-size',
        key: 'min',
        type: UtilityType.Shorthand,
        unit: 'rem',
        declarer: 'pair',
        declarerOptions: ['min-width', 'min-height']
    },
    {
        name: 'max-size',
        key: 'max',
        type: UtilityType.Shorthand,
        unit: 'rem',
        declarer: 'pair',
        declarerOptions: ['max-width', 'max-height']
    },
    {
        name: 'box-sizing',
        aliasGroups: ['box'],
        type: UtilityType.Native
    },
    {
        name: 'box-decoration-break',
        key: 'box-decoration',
        type: UtilityType.Native,
        declarations: ['-webkit-box-decoration-break', 'box-decoration-break']
    },
    {
        name: 'container',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'container-name',
        type: UtilityType.Native
    },
    {
        name: 'container-type',
        type: UtilityType.Native,
        aliasGroups: ['container'],
        values: ['size', 'inline-size', 'scroll-state'],
    },
    {
        name: 'contain',
        type: UtilityType.Native
    },
    {
        name: 'contain-intrinsic-inline-size',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'contain-intrinsic-block-size',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'content',
        type: UtilityType.Native
    },
    {
        name: 'counter-increment',
        type: UtilityType.Native
    },
    {
        name: 'counter-reset',
        type: UtilityType.Native,
    },
    {
        name: 'counter-set',
        type: UtilityType.Native,
    },
    {
        name: 'letter-spacing',
        key: 'tracking',
        subkey: 'ls',
        type: UtilityType.Native,
        unit: 'em'
    },
    {
        name: 'line-height',
        key: 'leading',
        subkey: 'line-h',
        type: UtilityType.Native
    },
    {
        name: 'object-fit',
        aliasGroups: ['object', 'obj'],
        values: ['contain', 'cover', 'fill', 'scale-down'],
        type: UtilityType.Native,
    },
    {
        name: 'object-position',
        aliasGroups: ['object', 'obj'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        type: UtilityType.Native,
    },
    {
        name: 'text-align',
        aliasGroups: ['text', 't'],
        values: ['justify', 'center', 'left', 'right', 'start', 'end'],
        type: UtilityType.Native,
    },
    {
        name: 'text-decoration-color',
        aliasGroups: ['text-decoration'],
        kind: 'color',
        type: UtilityType.Native,
        namespaces: ['color-text', 'color']
    },
    {
        name: 'text-decoration-style',
        aliasGroups: ['text-decoration'],
        values: ['solid', 'double', 'dotted', 'dashed', 'wavy'],
        type: UtilityType.Native,
    },
    {
        name: 'text-decoration-thickness',
        aliasGroups: ['text-decoration'],
        values: ['from-font'],
        kind: 'number',
        type: UtilityType.Native,
        unit: 'em'
    },
    {
        name: 'text-decoration-line',
        aliasGroups: ['text-decoration'],
        values: ['underline', 'overline', 'line-through'],
        type: UtilityType.Native,
    },
    {
        name: 'text-decoration',
        aliasGroups: ['text', 't'],
        values: ['underline', 'overline', 'line-through'],
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['color-text', 'color'],
        declarations: ['-webkit-text-decoration', 'text-decoration']
    },
    {
        name: 'text-underline-offset',
        aliasGroups: ['text-underline'],
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'text-underline-position',
        aliasGroups: ['text-underline'],
        values: ['front-font', 'under', 'left', 'right'],
        type: UtilityType.Native
    },
    {
        name: 'text-overflow',
        aliasGroups: ['text', 't'],
        values: ['ellipsis', 'clip'],
        type: UtilityType.Native
    },
    {
        name: 'text-orientation',
        aliasGroups: ['text', 't'],
        values: ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation'],
        type: UtilityType.Native
    },
    {
        name: 'text-transform',
        aliasGroups: ['text', 't'],
        values: ['uppercase', 'lowercase', 'capitalize'],
        type: UtilityType.Native,
    },
    {
        name: 'text-rendering',
        aliasGroups: ['text', 't'],
        values: ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision'],
        type: UtilityType.Native,
    },
    {
        name: 'text-wrap',
        aliasGroups: ['text', 't'],
        values: ['wrap', 'nowrap', 'balance', 'pretty'],
        type: UtilityType.NativeShorthand,
    },
    {
        name: 'text-indent',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'vertical-align',
        key: 'v',
        subkey: 'vertical',
        type: UtilityType.Native
    },
    {
        name: 'columns',
        key: 'cols',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'overflow-wrap',
        type: UtilityType.Native,
    },
    {
        name: 'white-space',
        type: UtilityType.Native
    },
    {
        name: 'top',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'bottom',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'left',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'right',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'inset',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'inset-inline-start',
        key: 'iis',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'inset-inline-end',
        key: 'iie',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'inset-inline',
        key: 'ii',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'inset-block-start',
        key: 'ibs',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'inset-block-end',
        key: 'ibe',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'inset-block',
        key: 'ib',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'max-height',
        key: 'max-h',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'max-width',
        key: 'max-w',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'max-inline-size',
        key: 'max-is',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'max-block-size',
        key: 'max-bs',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'opacity',
        type: UtilityType.Native,
    },
    {
        name: 'visibility',
        type: UtilityType.Native
    },
    {
        name: 'clear',
        type: UtilityType.Native,
    },
    {
        name: 'float',
        type: UtilityType.Native
    },
    {
        name: 'isolation',
        type: UtilityType.Native
    },
    {
        name: 'overflow-x',
        type: UtilityType.Native
    },
    {
        name: 'overflow-y',
        type: UtilityType.Native,
    },
    {
        name: 'overflow-inline',
        type: UtilityType.Native
    },
    {
        name: 'overflow-block',
        type: UtilityType.Native
    },
    {
        name: 'overflow',
        type: UtilityType.NativeShorthand,
    },
    {
        name: 'overscroll-behavior-x',
        type: UtilityType.Native
    },
    {
        name: 'overscroll-behavior-y',
        type: UtilityType.Native
    },
    {
        name: 'overscroll-behavior-inline',
        type: UtilityType.Native
    },
    {
        name: 'overscroll-behavior-block',
        type: UtilityType.Native
    },
    {
        name: 'overscroll-behavior',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'z-index',
        key: 'z',
        type: UtilityType.Native
    },
    {
        name: 'position',
        type: UtilityType.Native
    },
    {
        name: 'cursor',
        type: UtilityType.Native
    },
    {
        name: 'pointer-events',
        type: UtilityType.Native
    },
    {
        name: 'resize',
        type: UtilityType.Native
    },
    {
        name: 'touch-action',
        key: 'touch',
        type: UtilityType.Native
    },
    {
        name: 'word-break',
        type: UtilityType.Native
    },
    {
        name: 'word-spacing',
        type: UtilityType.Native,
        unit: 'em'
    },
    {
        name: 'hyphens',
        type: UtilityType.Native
    },
    {
        name: 'user-drag',
        type: UtilityType.Native,
        declarations: ['-webkit-user-drag', 'user-drag']
    },
    {
        name: 'user-select',
        type: UtilityType.Native,
        declarations: ['-webkit-user-select', 'user-select']
    },
    {
        name: 'text-shadow',
        unit: 'rem',
        type: UtilityType.Native,
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
        type: UtilityType.Shorthand,
        namespaces: ['font-size']
    },
    {
        name: 'text-fill-color',
        aliasGroups: ['text', 't'],
        kind: 'color',
        type: UtilityType.Native,
        namespaces: ['color-text', 'color'],
        declarations: ['-webkit-text-fill-color']
    },
    {
        name: 'text-stroke-width',
        aliasGroups: ['text-stroke'],
        values: ['thin', 'medium', 'thick'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native,
        declarations: ['-webkit-text-stroke-width']
    },
    {
        name: 'text-stroke-color',
        aliasGroups: ['text-stroke'],
        kind: 'color',
        type: UtilityType.Native,
        declarations: ['-webkit-text-stroke-color'],
        namespaces: ['color']
    },
    {
        name: 'text-stroke',
        unit: 'rem',
        type: UtilityType.Native,
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
        type: UtilityType.Shorthand,
    },
    {
        name: 'box-shadow',
        key: 'shadow',
        subkey: 's',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['shadow', 'color']
    },
    {
        name: 'table-layout',
        type: UtilityType.Native
    },
    {
        name: 'transform-box',
        aliasGroups: ['transform'],
        type: UtilityType.Native
    },
    {
        name: 'transform-style',
        aliasGroups: ['transform'],
        values: ['flat', 'preserve-3d'],
        type: UtilityType.Native
    },
    {
        name: 'transform-origin',
        aliasGroups: ['transform'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        kind: 'number',
        unit: 'px',
        type: UtilityType.Native
    },
    {
        name: 'transform',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'translate',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scale',
        type: UtilityType.Native
    },
    {
        name: 'rotate',
        type: UtilityType.Native,
        unit: 'deg'
    },
    {
        name: 'view-transition-name',
        key: 'vt-name',
        type: UtilityType.Native
    },
    {
        name: 'view-transition-class',
        key: 'vt-class',
        type: UtilityType.Native
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
        type: UtilityType.Native
    },
    {
        name: 'transition-timing-function',
        key: '~easing',
        type: UtilityType.Native,
        namespaces: ['easing']
    },
    {
        name: 'transition-duration',
        key: '~duration',
        type: UtilityType.Native,
        unit: 'ms',
        namespaces: ['duration']
    },
    {
        name: 'transition-delay',
        key: '~delay',
        type: UtilityType.Native,
        unit: 'ms'
    },
    {
        name: 'transition',
        sign: '~',
        type: UtilityType.NativeShorthand,
        namespaces: ['duration', 'easing']
    },
    {
        name: 'animation-delay',
        key: '@delay',
        type: UtilityType.Native,
        unit: 'ms'
    },
    {
        name: 'animation-direction',
        key: '@direction',
        type: UtilityType.Native
    },
    {
        name: 'animation-duration',
        key: '@duration',
        type: UtilityType.Native,
        unit: 'ms',
        namespaces: ['duration']
    },
    {
        name: 'animation-fill-mode',
        key: '@fill',
        type: UtilityType.Native
    },
    {
        name: 'animation-iteration-count',
        key: '@iteration',
        type: UtilityType.Native
    },
    {
        name: 'animation-name',
        key: '@name',
        type: UtilityType.Native,
        includeAnimations: true
    },
    {
        name: 'animation-play-state',
        key: '@play',
        type: UtilityType.Native
    },
    {
        name: 'animation-timing-function',
        key: '@easing',
        type: UtilityType.Native,
        namespaces: ['easing']
    },
    {
        name: 'animation',
        sign: '@',
        type: UtilityType.NativeShorthand,
        includeAnimations: true,
        namespaces: ['duration', 'easing']
    },
    {
        name: 'border-collapse',
        aliasGroups: ['b', 'border'],
        values: ['collapse', 'separate'],
        type: UtilityType.Native
    },
    {
        name: 'border-spacing',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'border-top-color',
        aliasGroups: ['bt', 'border-top'],
        kind: 'color',
        type: UtilityType.Native,
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-bottom-color',
        aliasGroups: ['bb', 'border-bottom'],
        kind: 'color',
        type: UtilityType.Native,
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-left-color',
        aliasGroups: ['bl', 'border-left'],
        kind: 'color',
        type: UtilityType.Native,
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-right-color',
        aliasGroups: ['br', 'border-right'],
        kind: 'color',
        type: UtilityType.Native,
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-x-color',
        aliasGroups: ['bx', 'border-x'],
        kind: 'color',
        type: UtilityType.Shorthand,
        namespaces: ['color-line', 'color'],
        declarations: ['border-left-color', 'border-right-color']
    },
    {
        name: 'border-y-color',
        aliasGroups: ['by', 'border-y'],
        kind: 'color',
        type: UtilityType.Shorthand,
        namespaces: ['color-line', 'color'],
        declarations: ['border-top-color', 'border-bottom-color']
    },
    {
        name: 'border-color',
        aliasGroups: ['b', 'border'],
        kind: 'color',
        type: UtilityType.NativeShorthand,
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-top-left-radius',
        key: 'rtl',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['border-radius']
    },
    {
        name: 'border-top-right-radius',
        key: 'rtr',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['border-radius']
    },
    {
        name: 'border-bottom-left-radius',
        key: 'rbl',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['border-radius']
    },
    {
        name: 'border-bottom-right-radius',
        key: 'rbr',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['border-radius']
    },
    {
        name: 'border-top-radius',
        key: 'rt',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['border-top-left-radius', 'border-top-right-radius'],
        namespaces: ['border-radius']
    },
    {
        name: 'border-bottom-radius',
        key: 'rb',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['border-bottom-left-radius', 'border-bottom-right-radius'],
        namespaces: ['border-radius']
    },
    {
        name: 'border-left-radius',
        key: 'rl',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['border-top-left-radius', 'border-bottom-left-radius'],
        namespaces: ['border-radius']
    },
    {
        name: 'border-right-radius',
        key: 'rr',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['border-top-right-radius', 'border-bottom-right-radius'],
        namespaces: ['border-radius']
    },
    {
        name: 'border-radius',
        key: 'r',
        unit: 'rem',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'border-top-style',
        aliasGroups: ['bt', 'border-top'],
        values: BORDER_STYLE_VALUES,
        type: UtilityType.Native,
    },
    {
        name: 'border-bottom-style',
        aliasGroups: ['bb', 'border-bottom'],
        values: BORDER_STYLE_VALUES,
        type: UtilityType.Native,
    },
    {
        name: 'border-left-style',
        aliasGroups: ['bl', 'border-left'],
        values: BORDER_STYLE_VALUES,
        type: UtilityType.Native,
    },
    {
        name: 'border-right-style',
        aliasGroups: ['br', 'border-right'],
        values: BORDER_STYLE_VALUES,
        type: UtilityType.Native,
    },
    {
        name: 'border-x-style',
        aliasGroups: ['bx', 'border-x'],
        values: BORDER_STYLE_VALUES,
        type: UtilityType.Shorthand,
        declarations: ['border-left-style', 'border-right-style']
    },
    {
        name: 'border-y-style',
        aliasGroups: ['by', 'border-y'],
        values: BORDER_STYLE_VALUES,
        type: UtilityType.Shorthand,
        declarations: ['border-top-style', 'border-bottom-style']
    },
    {
        name: 'border-style',
        aliasGroups: ['b', 'border'],
        values: BORDER_STYLE_VALUES,
        type: UtilityType.NativeShorthand
    },
    {
        name: 'border-top-width',
        aliasGroups: ['bt', 'border-top'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native,
    },
    {
        name: 'border-bottom-width',
        aliasGroups: ['bb', 'border-bottom'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native,
    },
    {
        name: 'border-left-width',
        aliasGroups: ['bl', 'border-left'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native,
    },
    {
        name: 'border-right-width',
        aliasGroups: ['br', 'border-right'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native,
    },
    {
        name: 'border-x-width',
        aliasGroups: ['bx', 'border-x'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['border-left-width', 'border-right-width']
    },
    {
        name: 'border-y-width',
        aliasGroups: ['by', 'border-y'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['border-top-width', 'border-bottom-width']
    },
    {
        name: 'border-width',
        aliasGroups: ['b', 'border'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'border-image-repeat',
        aliasGroups: ['border-image'],
        values: ['stretch', 'repeat', 'round', 'space'],
        type: UtilityType.Native
    },
    {
        name: 'border-image-slice',
        aliasGroups: ['border-image'],
        type: UtilityType.Native
    },
    {
        name: 'border-image-source',
        aliasGroups: ['border-image'],
        kind: 'image',
        type: UtilityType.Native
    },
    {
        name: 'border-image-width',
        aliasGroups: ['border-image'],
        values: ['auto'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'border-image-outset',
        aliasGroups: ['border-image'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'border-image',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'border-top',
        key: 'bt',
        type: UtilityType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-bottom',
        key: 'bb',
        type: UtilityType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-left',
        key: 'bl',
        type: UtilityType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-right',
        key: 'br',
        type: UtilityType.NativeShorthand,
        unit: 'rem',
        transformer: 'auto-fill-solid',
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-x',
        key: 'bx',
        unit: 'rem',
        type: UtilityType.Shorthand,
        transformer: 'auto-fill-solid',
        namespaces: ['color-line', 'color'],
        declarations: ['border-left', 'border-right']
    },
    {
        name: 'border-y',
        key: 'by',
        unit: 'rem',
        type: UtilityType.Shorthand,
        transformer: 'auto-fill-solid',
        namespaces: ['color-line', 'color'],
        declarations: ['border-top', 'border-bottom']
    },
    {
        name: 'border',
        key: 'b',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        transformer: 'auto-fill-solid',
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'border-inline-start-color', kind: 'color', type: UtilityType.Native, namespaces: ['color-line', 'color'] },
    {
        name: 'border-inline-end-color', kind: 'color', type: UtilityType.Native, namespaces: ['color-line', 'color'] },
    {
        name: 'border-block-start-color', kind: 'color', type: UtilityType.Native, namespaces: ['color-line', 'color'] },
    {
        name: 'border-block-end-color', kind: 'color', type: UtilityType.Native, namespaces: ['color-line', 'color'] },
    {
        name: 'border-inline-color', kind: 'color', type: UtilityType.NativeShorthand, namespaces: ['color-line', 'color'] },
    {
        name: 'border-block-color', kind: 'color', type: UtilityType.NativeShorthand, namespaces: ['color-line', 'color'] },
    {
        name: 'border-inline-start-style', values: BORDER_STYLE_VALUES, type: UtilityType.Native },
    {
        name: 'border-inline-end-style', values: BORDER_STYLE_VALUES, type: UtilityType.Native },
    {
        name: 'border-block-start-style', values: BORDER_STYLE_VALUES, type: UtilityType.Native },
    {
        name: 'border-block-end-style', values: BORDER_STYLE_VALUES, type: UtilityType.Native },
    {
        name: 'border-inline-style', values: BORDER_STYLE_VALUES, type: UtilityType.NativeShorthand },
    {
        name: 'border-block-style', values: BORDER_STYLE_VALUES, type: UtilityType.NativeShorthand },
    {
        name: 'border-inline-start-width', kind: 'number', unit: 'rem', type: UtilityType.Native },
    {
        name: 'border-inline-end-width', kind: 'number', unit: 'rem', type: UtilityType.Native },
    {
        name: 'border-block-start-width', kind: 'number', unit: 'rem', type: UtilityType.Native },
    {
        name: 'border-block-end-width', kind: 'number', unit: 'rem', type: UtilityType.Native },
    {
        name: 'border-inline-width', kind: 'number', unit: 'rem', type: UtilityType.NativeShorthand },
    {
        name: 'border-block-width', kind: 'number', unit: 'rem', type: UtilityType.NativeShorthand },
    {
        name: 'border-inline-start', unit: 'rem', type: UtilityType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color-line', 'color'] },
    {
        name: 'border-inline-end', unit: 'rem', type: UtilityType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color-line', 'color'] },
    {
        name: 'border-block-start', unit: 'rem', type: UtilityType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color-line', 'color'] },
    {
        name: 'border-block-end', unit: 'rem', type: UtilityType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color-line', 'color'] },
    {
        name: 'border-inline', unit: 'rem', type: UtilityType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color-line', 'color'] },
    {
        name: 'border-block', unit: 'rem', type: UtilityType.NativeShorthand, transformer: 'auto-fill-solid', namespaces: ['color-line', 'color'] },
    {
        name: 'border-start-start-radius', unit: 'rem', type: UtilityType.Native, namespaces: ['border-radius'] },
    {
        name: 'border-start-end-radius', unit: 'rem', type: UtilityType.Native, namespaces: ['border-radius'] },
    {
        name: 'border-end-start-radius', unit: 'rem', type: UtilityType.Native, namespaces: ['border-radius'] },
    {
        name: 'border-end-end-radius', unit: 'rem', type: UtilityType.Native, namespaces: ['border-radius'] },
    {
        name: 'background-attachment',
        aliasGroups: ['bg'],
        values: ['fixed', 'local', 'scroll'],
        type: UtilityType.Native
    },
    {
        name: 'background-blend-mode',
        key: 'bg-blend',
        type: UtilityType.Native
    },
    {
        name: 'background-color',
        aliasGroups: ['bg'],
        kind: 'color',
        type: UtilityType.Native,
        namespaces: ['color']
    },
    {
        name: 'background-clip',
        key: 'bg-clip',
        type: UtilityType.Native
    },
    {
        name: 'background-origin',
        key: 'bg-origin',
        type: UtilityType.Native
    },
    {
        name: 'background-position',
        aliasGroups: ['bg'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        type: UtilityType.Native,
        unit: 'px'
    },
    {
        name: 'background-repeat',
        aliasGroups: ['bg'],
        values: ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'],
        type: UtilityType.Native
    },
    {
        name: 'background-size',
        aliasGroups: ['bg'],
        values: ['auto', 'cover', 'contain'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'background-image',
        aliasGroups: ['bg'],
        kind: 'image',
        type: UtilityType.Native,
        namespaces: ['color']
    },
    {
        name: 'background',
        key: 'bg',
        type: UtilityType.NativeShorthand,
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
        type: UtilityType.Native
    },
    {
        name: 'backdrop-filter',
        key: 'bd',
        type: UtilityType.Native,
        declarations: ['-webkit-backdrop-filter', 'backdrop-filter'],
        namespaces: ['color']
    },
    {
        name: 'filter',
        type: UtilityType.Native,
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
        type: UtilityType.Native,
        namespaces: ['color']
    },
    {
        name: 'stroke-dasharray',
        type: UtilityType.Native
    },
    {
        name: 'stroke-dashoffset',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'stroke-width',
        aliasGroups: ['stroke'],
        kind: 'number',
        type: UtilityType.Native
    },
    {
        name: 'stroke',
        type: UtilityType.Native,
        namespaces: ['color']
    },
    {
        name: 'x',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'y',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'cx',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'cy',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'rx',
        type: UtilityType.Native
    },
    {
        name: 'ry',
        type: UtilityType.Native
    },
    {
        name: 'grid-column-start',
        key: 'grid-col-start',
        type: UtilityType.Native
    },
    {
        name: 'grid-column-end',
        key: 'grid-col-end',
        type: UtilityType.Native
    },
    {
        name: 'grid-column-span',
        key: 'grid-col-span',
        type: UtilityType.Shorthand,
        declarations: {
            'grid-column': ['span ', undefined, '/span ', undefined]
        }
    },
    {
        name: 'grid-column',
        key: 'grid-col',
        type: UtilityType.NativeShorthand,
    },
    {
        name: 'grid-columns',
        key: 'grid-cols',
        declarations: {
            display: 'grid',
            'grid-template-columns': ['repeat(', undefined, ',minmax(0,1fr))'],
        },
        type: UtilityType.Shorthand
    },
    {
        name: 'grid-row-start',
        type: UtilityType.Native
    },
    {
        name: 'grid-row-end',
        type: UtilityType.Native
    },
    {
        name: 'grid-row-span',
        type: UtilityType.Shorthand,
        declarations: {
            'grid-row': ['span ', undefined, '/span ', undefined]
        }
    },
    {
        name: 'grid-row',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'grid-rows',
        declarations: {
            display: 'grid',
            'grid-auto-flow': 'column',
            'grid-template-rows': ['repeat(', undefined, ',minmax(0,1fr))'],
        },
        type: UtilityType.Shorthand
    },
    {
        name: 'grid-auto-columns',
        key: 'grid-auto-cols',
        type: UtilityType.Native
    },
    {
        name: 'grid-auto-flow',
        key: 'grid-flow',
        type: UtilityType.Native
    },
    {
        name: 'grid-auto-rows',
        type: UtilityType.Native
    },
    {
        name: 'grid-template-areas',
        type: UtilityType.Native
    },
    {
        name: 'grid-template-columns',
        key: 'grid-template-cols',
        type: UtilityType.Native,
        unit: 'rem'
    },
    {
        name: 'grid-template-rows',
        type: UtilityType.Native,
        unit: 'rem'
    },
    {
        name: 'grid-template',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'grid-area',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'grid',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'column-gap',
        key: 'gap-x',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'row-gap',
        key: 'gap-y',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'gap',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'order',
        key: 'o',
        type: UtilityType.Native
    },
    {
        name: 'break-inside',
        type: UtilityType.Native
    },
    {
        name: 'break-before',
        type: UtilityType.Native
    },
    {
        name: 'break-after',
        type: UtilityType.Native
    },
    {
        name: 'aspect-ratio',
        key: 'aspect',
        type: UtilityType.Native
    },
    {
        name: 'column-span',
        key: 'col-span',
        type: UtilityType.Native
    },
    {
        name: 'align-content',
        subkey: 'ac',
        type: UtilityType.Native
    },
    {
        name: 'align-items',
        subkey: 'ai',
        type: UtilityType.Native
    },
    {
        name: 'align-self',
        subkey: 'as',
        type: UtilityType.Native
    },
    {
        name: 'justify-content',
        subkey: 'jc',
        type: UtilityType.Native
    },
    {
        name: 'justify-items',
        subkey: 'ji',
        type: UtilityType.Native
    },
    {
        name: 'justify-self',
        subkey: 'js',
        type: UtilityType.Native
    },
    {
        name: 'place-content',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'place-items',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'place-self',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'list-style-position',
        aliasGroups: ['list-style'],
        values: ['inside', 'outside'],
        type: UtilityType.Native
    },
    {
        name: 'list-style-type',
        aliasGroups: ['list-style'],
        values: ['disc', 'decimal'],
        type: UtilityType.Native
    },
    {
        name: 'list-style-image',
        aliasGroups: ['list-style'],
        kind: 'image',
        type: UtilityType.Native
    },
    {
        name: 'list-style',
        type: UtilityType.NativeShorthand
    },
    {
        name: 'outline-color',
        aliasGroups: ['outline'],
        kind: 'color',
        type: UtilityType.Native,
        namespaces: ['color-line', 'color'],
    },
    {
        name: 'outline-offset',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'outline-style',
        aliasGroups: ['outline'],
        values: BORDER_STYLE_VALUES,
        type: UtilityType.Native
    },
    {
        name: 'outline-width',
        aliasGroups: ['outline'],
        values: ['medium', 'thick', 'thin'],
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native
    },
    {
        name: 'outline',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: [
            'outline-width',
            'outline-style',
            'outline-offset',
            'outline-color',
            'color-line',
            'color'
        ],
        transformer: 'auto-fill-solid'
    },
    {
        name: 'accent-color',
        key: 'accent',
        type: UtilityType.Native,
        namespaces: ['color']
    },
    {
        name: 'appearance',
        type: UtilityType.Native
    },
    {
        name: 'caret-color',
        key: 'caret',
        type: UtilityType.Native,
        namespaces: ['color-text', 'color']
    },
    {
        name: 'scroll-behavior',
        type: UtilityType.Native
    },
    {
        name: 'scroll-margin-left',
        key: 'scroll-ml',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-right',
        key: 'scroll-mr',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-top',
        key: 'scroll-mt',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-bottom',
        key: 'scroll-mb',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-x',
        key: 'scroll-mx',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['scroll-margin-left', 'scroll-margin-right'],
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin-y',
        key: 'scroll-my',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['scroll-margin-top', 'scroll-margin-bottom'],
        namespaces: ['spacing']
    },
    {
        name: 'scroll-margin',
        key: 'scroll-m',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-left',
        key: 'scroll-pl',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-right',
        key: 'scroll-pr',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-top',
        key: 'scroll-pt',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-bottom',
        key: 'scroll-pb',
        type: UtilityType.Native,
        unit: 'rem',
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-x',
        key: 'scroll-px',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['scroll-padding-left', 'scroll-padding-right'],
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding-y',
        key: 'scroll-py',
        unit: 'rem',
        type: UtilityType.Shorthand,
        declarations: ['scroll-padding-top', 'scroll-padding-bottom'],
        namespaces: ['spacing']
    },
    {
        name: 'scroll-padding',
        key: 'scroll-p',
        unit: 'rem',
        type: UtilityType.NativeShorthand,
        namespaces: ['spacing']
    },
    {
        name: 'scroll-snap-align',
        aliasGroups: ['scroll-snap'],
        values: ['start', 'end', 'center'],
        type: UtilityType.Native
    },
    {
        name: 'scroll-snap-stop',
        aliasGroups: ['scroll-snap'],
        values: ['normal', 'always'],
        type: UtilityType.Native
    },
    {
        name: 'scroll-snap-type',
        aliasGroups: ['scroll-snap'],
        values: ['x', 'y', 'block', 'inline', 'both'],
        type: UtilityType.Native
    },
    {
        name: 'will-change',
        type: UtilityType.Native
    },
    {
        name: 'writing-mode',
        key: 'writing',
        type: UtilityType.Native
    },
    {
        name: 'direction',
        type: UtilityType.Native
    },
    {
        name: 'shape-outside',
        key: 'shape',
        type: UtilityType.Native
    },
    {
        name: 'shape-margin',
        kind: 'number',
        unit: 'rem',
        type: UtilityType.Native,
        namespaces: ['spacing']
    },
    {
        name: 'shape-image-threshold',
        type: UtilityType.Native
    },
    {
        name: 'clip-path',
        key: 'clip',
        type: UtilityType.Native
    },
    {
        name: 'quotes',
        type: UtilityType.Native
    },
    {
        name: 'mask-image',
        type: UtilityType.Native,
        declarations: ['-webkit-mask-image', 'mask-image']
    },
    {
        name: 'group',
        matcher: '^\\{.+?\\}',
        type: UtilityType.Shorthand,
        declarer: 'core.group'
    },
    {
        name: 'variable',
        matcher: '^\\$[\\w-]+:', // don't use 'rem' as default, because css variable is common API
        type: UtilityType.Shorthand,
        declarer: 'core.variable'
    }
] satisfies UtilityDefinitions

export default utilities
