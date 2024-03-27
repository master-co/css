import cssEscape from 'css-shared/utils/css-escape'
import type { Rule, RuleDefinition } from '../rule'
import Layer from '../layer'
import { VALUE_DELIMITERS } from '../common'

// keys
const FONT_KEYS = ['font', 'f']
const FLEX_KEYS = ['flex']
const BORDER_KEYS = ['b', 'border']

// values
const BORDER_STYLE_VALUES = ['none', 'auto', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']

export const autofillSolidToValueComponent: RuleDefinition['transformValueComponents'] = function (valueComponents) {
    if (valueComponents.length < 2) return valueComponents
    const styleValueComponent = valueComponents.find((valueComponent) => {
        return valueComponent.type === 'string' && BORDER_STYLE_VALUES.includes(valueComponent.value) ||
            valueComponent.type === 'variable' && BORDER_STYLE_VALUES.includes(valueComponent.variable?.value)
    })
    if (!styleValueComponent) {
        valueComponents.push(
            { type: 'separator', value: ' ', token: '|' },
            { type: 'string', value: 'solid', token: 'solid' }
        )
    }
    return valueComponents
}

// todo try to remove numeric and recognize unit instead

const rules = {
    group: {
        match: /^(?:.+?[*_>~+])?\{.+?\}/,
        layer: Layer.Core,
        analyze(className: string) {
            let i = 0
            for (; i < className.length; i++) {
                if (className[i] === '{' && className[i - 1] !== '\\') {
                    break
                }
            }
            return [className.slice(i), className.slice(0, i)]
        },
        declare(value) {
            const declarations: any = {}
            const addProp = (propertyName: string) => {
                const indexOfColon = propertyName.indexOf(':')
                if (indexOfColon !== -1) {
                    const propName = propertyName.slice(0, indexOfColon)
                    declarations[propName] = propertyName.slice(indexOfColon + 1)
                }
            }
            const handleRule = (rule: Rule) => {
                const addProps = (cssText: string) => {
                    const cssProperties = cssText.slice(cssEscape(rule.className).length).match(/\{(.*)\}/)?.[1].split(';')
                    if (cssProperties)
                        for (const eachCssProperty of cssProperties) {
                            addProp(eachCssProperty)
                        }
                }

                for (const eachNative of rule.natives) {
                    addProps(eachNative.text)
                }

                // animation
                if (rule.animationNames) {
                    if (!this.animationNames) {
                        this.animationNames = []
                    }
                    for (const eachKeyframeName of rule.animationNames) {
                        if (!this.animationNames.includes(eachKeyframeName)) {
                            this.animationNames.push(eachKeyframeName)
                        }
                    }
                }

                // variable
                if (rule.variableNames) {
                    if (!this.variableNames) {
                        this.variableNames = []
                    }
                    for (const eachVariableName of rule.variableNames) {
                        if (!this.variableNames.includes(eachVariableName)) {
                            this.variableNames.push(eachVariableName)
                        }
                    }
                }
            }

            const names: string[] = []
            let currentName = ''
            const addName = () => {
                if (currentName) {
                    names.push(currentName.replace(/ /g, '|'))
                    currentName = ''
                }
            }

            let i = 1;
            (function analyze(end: string) {
                for (; i < value.length; i++) {
                    const char = value[i]

                    if (!end) {
                        if (char === ';') {
                            addName()
                            continue
                        }
                        if (char === '}') {
                            break
                        }
                    }

                    currentName += char

                    if (end === char) {
                        if (end === '\'' || end === '"') {
                            let count = 0
                            for (let j = currentName.length - 2; ; j--) {
                                if (currentName[j] !== '\\') {
                                    break
                                }
                                count++
                            }
                            if (count % 2) {
                                continue
                            }
                        }

                        break
                    } else if (char in VALUE_DELIMITERS && (end !== '\'' && end !== '"')) {
                        i++
                        analyze(VALUE_DELIMITERS[char as keyof typeof VALUE_DELIMITERS])
                    }
                }
            })('')

            addName()

            for (const eachName of names) {
                const rules = this.css.generate(eachName)
                if (rules.length) {
                    for (const eachRule of rules) {
                        handleRule(eachRule)
                    }
                } else {
                    addProp(eachName)
                }
            }

            return declarations
        }
    } as RuleDefinition,
    variable: {
        match: /^\$[\w-]+:/, // don't use 'rem' as default, because css variable is common API
        colored: true,
        layer: Layer.Core,
        declare(value) {
            return {
                ['--' + this.keyToken.slice(1, -1)]: value
            }
        }
    } as RuleDefinition,
    'font-size': {
        keys: FONT_KEYS,
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'font-weight': {
        keys: FONT_KEYS,
        values: ['bolder'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'font-family': {
        keys: FONT_KEYS,
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'font-smoothing': {
        keys: FONT_KEYS,
        values: ['antialiased', 'subpixel-antialiased'],
        ambiguous: true,
        layer: Layer.CoreNative,
        declare(value) {
            switch (value) {
                case 'subpixel-antialiased':
                    return {
                        '-webkit-font-smoothing': 'auto',
                        '-moz-osx-font-smoothing': 'auto'
                    }
                case 'antialiased':
                    return {
                        '-webkit-font-smoothing': 'antialiased',
                        '-moz-osx-font-smoothing': 'grayscale'
                    }
            }
        }
    } as RuleDefinition,
    'font-style': {
        keys: FONT_KEYS,
        values: ['normal', 'italic', 'oblique'],
        ambiguous: true,
        layer: Layer.CoreNative,
        unit: 'deg'
    } as RuleDefinition,
    'font-variant-numeric': {
        keys: FONT_KEYS,
        values: ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'font-variant': {
        layer: Layer.CoreNativeShorthand,
    },
    font: {
        keys: FONT_KEYS,
        layer: Layer.CoreNativeShorthand,
        variables: [
            'font-family',
            'font-variant',
            'font-weight',
            'font-size',
            'font-style',
            'line-height'
        ]
    } as RuleDefinition,
    'font-feature-settings': {
        keys: ['font-feature'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    color: {
        keys: ['fg'],
        layer: Layer.CoreNative,
        colored: true,
        variables: ['text', 't']
    } as RuleDefinition,
    // margin
    'margin-left': {
        keys: ['ml'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-right': {
        keys: ['mr'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-top': {
        keys: ['mt'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-bottom': {
        keys: ['mb'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-x': {
        keys: ['mx'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'margin-left': value,
                'margin-right': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'margin-y': {
        keys: ['my'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'margin-top': value,
                'margin-bottom': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    margin: {
        keys: ['m'],
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // margin inline
    'margin-inline-start': {
        keys: ['mis'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-inline-end': {
        keys: ['mie'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-inline': {
        keys: ['mi'],
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // padding
    'padding-left': {
        keys: ['pl'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-right': {
        keys: ['pr'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-top': {
        keys: ['pt'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-bottom': {
        keys: ['pb'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-x': {
        keys: ['px'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'padding-left': value,
                'padding-right': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'padding-y': {
        keys: ['py'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'padding-top': value,
                'padding-bottom': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    padding: {
        keys: ['p'],
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // padding inline
    'padding-inline-start': {
        keys: ['pis'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-inline-end': {
        keys: ['pie'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-inline': {
        keys: ['pi'],
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // flex
    'flex-basis': {
        keys: FLEX_KEYS,
        ambiguous: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'flex-wrap': {
        keys: FLEX_KEYS,
        values: ['wrap', 'nowrap', 'wrap-reverse'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'flex-grow': {
        keys: FLEX_KEYS,
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'flex-shrink': {
        keys: FLEX_KEYS,
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'flex-direction': {
        keys: FLEX_KEYS,
        values: ['row', 'row-reverse', 'column', 'column-reverse'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    flex: {
        keys: FLEX_KEYS,
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    display: {
        keys: ['d'],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    width: {
        keys: ['w'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    height: {
        keys: ['h'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'min-width': {
        keys: ['min-w'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'min-height': {
        keys: ['min-h'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    size: {
        keys: ['size'],
        layer: Layer.CoreShorthand,
        unit: 'rem',
        declare(_value, valueComponents) {
            const length = valueComponents.length
            return {
                width: length === 1
                    ? valueComponents[0].text
                    : valueComponents[0].text,
                height: length === 1
                    ? valueComponents[0].text
                    : valueComponents[2].text
            }
        }
    } as RuleDefinition,
    'min-size': {
        keys: ['min'],
        layer: Layer.CoreShorthand,
        unit: 'rem',
        declare(_value, valueComponents) {
            const length = valueComponents.length
            return {
                'min-width': length === 1
                    ? valueComponents[0].text
                    : valueComponents[0].text,
                'min-height': length === 1
                    ? valueComponents[0].text
                    : valueComponents[2].text
            }
        }
    } as RuleDefinition,
    'max-size': {
        keys: ['max'],
        layer: Layer.CoreShorthand,
        unit: 'rem',
        declare(_value, valueComponents) {
            const length = valueComponents.length
            return {
                'max-width': length === 1
                    ? valueComponents[0].text
                    : valueComponents[0].text,
                'max-height': length === 1
                    ? valueComponents[0].text
                    : valueComponents[2].text
            }
        }
    } as RuleDefinition,
    'box-sizing': {
        keys: ['box'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'box-decoration-break': {
        keys: ['box-decoration'],
        layer: Layer.CoreNative,
        declare(value) {
            return {
                'box-decoration-break': value,
                '-webkit-box-decoration-break': value
            }
        }
    } as RuleDefinition,
    contain: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    content: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'counter-increment': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'counter-reset': {
        layer: Layer.CoreNative,
    } as RuleDefinition,
    // todo: new key 'tracking'
    'letter-spacing': {
        keys: ['ls'],
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleDefinition,
    'line-height': {
        keys: ['lh'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'object-fit': {
        keys: ['object', 'obj'],
        values: ['contain', 'cover', 'fill', 'scale-down'],
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'object-position': {
        keys: ['object', 'obj'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-align': {
        keys: ['text', 't'],
        values: ['justify', 'center', 'left', 'right', 'start', 'end'],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-decoration-color': {
        keys: ['text-decoration'],
        ambiguous: true,
        colored: true,
        layer: Layer.CoreNative,
        variables: ['text', 't']
    } as RuleDefinition,
    'text-decoration-style': {
        keys: ['text-decoration'],
        values: ['solid', 'double', 'dotted', 'dashed', 'wavy'],
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-decoration-thickness': {
        keys: ['text-decoration'],
        values: ['from-font'],
        ambiguous: true,
        numeric: true,
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleDefinition,
    'text-decoration-line': {
        keys: ['text-decoration'],
        values: ['underline', 'overline', 'line-through'],
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    // todo: prefix -webkit- to support Safari
    'text-decoration': {
        keys: ['text', 't'],
        values: ['underline', 'overline', 'line-through'],
        ambiguous: true,
        unit: 'rem',
        colored: true,
        layer: Layer.CoreNativeShorthand,
        variables: ['text', 't']
    } as RuleDefinition,
    'text-underline-offset': {
        keys: ['text-underline'],
        ambiguous: true,
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    // todo: add text-underline-position
    // 'text-underline-position': {
    //     keys: ['text-underline'],
    //     values: ['front-font', 'under', 'left', 'right'],
    //     ambiguous: true,
    //     layer: Layer.CoreNative
    // } as RuleDefinition,
    'text-overflow': {
        keys: ['text', 't'],
        values: ['ellipsis', 'clip'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'text-orientation': {
        keys: ['text', 't'],
        values: ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'text-transform': {
        keys: ['text', 't'],
        values: ['uppercase', 'lowercase', 'capitalize'],
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-rendering': {
        keys: ['text', 't'],
        values: ['optimizespeed', 'optimizelegibility', 'geometricprecision'],
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-indent': {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'vertical-align': {
        keys: ['vertical', 'v'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    columns: {
        keys: ['cols'],
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'white-space': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    top: {
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    bottom: {
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    left: {
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    right: {
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    inset: {
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // todo: truncate:1 truncate:2
    lines: {
        keys: ['lines'],
        declare(value) {
            return {
                overflow: 'hidden',
                display: '-webkit-box',
                'overflow-wrap': 'break-word',
                'text-overflow': 'ellipsis',
                '-webkit-box-orient': 'vertical',
                '-webkit-line-clamp': value
            }
        },
    } as RuleDefinition,
    'max-height': {
        keys: ['max-h'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'max-width': {
        keys: ['max-w'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    opacity: {
        layer: Layer.CoreNative,
    } as RuleDefinition,
    visibility: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    clear: {
        layer: Layer.CoreNative,
    } as RuleDefinition,
    float: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    isolation: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'overflow-x': {
        layer: Layer.CoreNative,
        declare(value) {
            return value === 'overlay'
                ? { 'overflow-x': ['auto', value] }
                : { 'overflow-x': value }
        }
    } as RuleDefinition,
    'overflow-y': {
        layer: Layer.CoreNative,
        declare(value) {
            return value === 'overlay'
                ? { 'overflow-y': ['auto', value] }
                : { 'overflow-y': value }
        }
    } as RuleDefinition,
    overflow: {
        layer: Layer.CoreNativeShorthand,
        declare(value) {
            return value === 'overlay'
                ? { overflow: ['auto', value] }
                : { overflow: value }
        }
    } as RuleDefinition,
    'overscroll-behavior-x': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'overscroll-behavior-y': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'overscroll-behavior': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'z-index': {
        keys: ['z'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    position: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    cursor: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'pointer-events': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    resize: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'touch-action': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'word-break': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'word-spacing': {
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleDefinition,
    'user-drag': {
        layer: Layer.CoreNative,
        declare(value) {
            return {
                'user-drag': value,
                '-webkit-user-drag': value
            }
        }
    } as RuleDefinition,
    'user-select': {
        layer: Layer.CoreNative,
        declare(value) {
            return {
                'user-select': value,
                '-webkit-user-select': value
            }
        }
    } as RuleDefinition,
    'text-shadow': {
        unit: 'rem',
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'text-size': {
        keys: ['text', 't'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        declare(value) {
            const diff = .875
            return {
                'font-size': value,
                'line-height': `calc(${value} + ${diff}em)`
            }
        }
    } as RuleDefinition,
    'text-fill-color': {
        keys: ['text', 't'],
        ambiguous: true,
        layer: Layer.CoreNative,
        colored: true,
        variables: ['text'],
        declare(value) {
            return {
                '-webkit-text-fill-color': value
            }
        }
    } as RuleDefinition,
    'text-stroke-width': {
        keys: ['text-stroke'],
        values: ['thin', 'medium', 'thick'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
        declare(value) {
            return {
                '-webkit-text-stroke-width': value
            }
        },
    } as RuleDefinition,
    'text-stroke-color': {
        keys: ['text-stroke'],
        ambiguous: true,
        layer: Layer.CoreNative,
        colored: true,
        variables: ['text', 't'],
        declare(value) {
            return {
                '-webkit-text-stroke-color': value
            }
        }
    } as RuleDefinition,
    'text-stroke': {
        unit: 'rem',
        layer: Layer.CoreNative,
        declare(value) {
            return {
                '-webkit-text-stroke': value
            }
        }
    } as RuleDefinition,
    'box-shadow': {
        keys: ['shadow', 's'],
        unit: 'rem',
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'table-layout': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transform-box': {
        keys: ['transform'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transform-style': {
        keys: ['transform'],
        values: ['flat', 'preserve-3d'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transform-origin': {
        keys: ['transform'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        ambiguous: true,
        numeric: true,
        unit: 'px',
        layer: Layer.CoreNative
    } as RuleDefinition,
    transform: {
        match: /^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\(/,
        layer: Layer.CoreNative,
        analyze(className: string) {
            return [className.startsWith('transform') ? className.slice(10) : className]
        },
        variables: ['spacing']
    } as RuleDefinition,
    'transition-property': {
        keys: ['~property'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transition-timing-function': {
        keys: ['~easing'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transition-duration': {
        keys: ['~duration'],
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleDefinition,
    'transition-delay': {
        keys: ['~delay'],
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleDefinition,
    transition: {
        match: /^~[^!*>+~:[@_]+\|/,
        analyze(className: string) {
            if (className.startsWith('~')) {
                return [className.slice(1)]
            } else {
                const indexOfColon = className.indexOf(':')
                this.keyToken = className.slice(0, indexOfColon + 1)
                return [className.slice(indexOfColon + 1)]
            }
        },
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'animation-delay': {
        keys: ['@delay'],
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleDefinition,
    'animation-direction': {
        keys: ['@direction'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-duration': {
        keys: ['@duration'],
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleDefinition,
    'animation-fill-mode': {
        keys: ['@fill'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-iteration-count': {
        keys: ['@iteration'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-name': {
        keys: ['@name'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-play-state': {
        keys: ['@play'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-timing-function': {
        keys: ['@easing'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    animation: {
        match: /^@[^!*>+~:[@_]+\|/,
        layer: Layer.CoreNativeShorthand,
        analyze(className: string) {
            if (className.startsWith('@')) {
                return [className.slice(1)]
            } else {
                const indexOfColon = className.indexOf(':')
                this.keyToken = className.slice(0, indexOfColon + 1)
                return [className.slice(indexOfColon + 1)]
            }
        }
    } as RuleDefinition,
    'border-collapse': {
        keys: BORDER_KEYS,
        values: ['collapse', 'separate'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-spacing': {
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    // border color
    'border-top-color': {
        keys: ['bt', 'border-top'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'border-bottom-color': {
        keys: ['bb', 'border-bottom'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'border-left-color': {
        keys: ['bl', 'border-left'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'border-right-color': {
        keys: ['br', 'border-right'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'border-x-color': {
        keys: ['bx', 'border-x'],
        layer: Layer.CoreShorthand,
        colored: true,
        declare(value) {
            return {
                'border-left-color': value,
                'border-right-color': value
            }
        }
    } as RuleDefinition,
    'border-y-color': {
        keys: ['by', 'border-y'],
        layer: Layer.CoreShorthand,
        colored: true,
        declare(value) {
            return {
                'border-top-color': value,
                'border-bottom-color': value
            }
        }
    } as RuleDefinition,
    'border-color': {
        keys: ['b', 'border'],
        layer: Layer.CoreNativeShorthand,
        colored: true
    } as RuleDefinition,
    // border radius
    'border-top-left-radius': {
        keys: ['rtl'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-top-right-radius': {
        keys: ['rtr'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-bottom-left-radius': {
        keys: ['rbl'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-bottom-right-radius': {
        keys: ['rbr'],
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-top-radius': {
        keys: ['rt'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-top-left-radius': value,
                'border-top-right-radius': value
            }
        }
    } as RuleDefinition,
    'border-bottom-radius': {
        keys: ['rb'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-bottom-left-radius': value,
                'border-bottom-right-radius': value
            }
        }
    } as RuleDefinition,
    'border-left-radius': {
        keys: ['rl'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-top-left-radius': value,
                'border-bottom-left-radius': value
            }
        }
    } as RuleDefinition,
    'border-right-radius': {
        keys: ['rr'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-top-right-radius': value,
                'border-bottom-right-radius': value
            }
        }
    } as RuleDefinition,
    'border-radius': {
        keys: ['r'],
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    // border style
    'border-top-style': {
        keys: ['bt', 'border-top'],
        values: BORDER_STYLE_VALUES,
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-bottom-style': {
        keys: ['bb', 'border-bottom'],
        values: BORDER_STYLE_VALUES,
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-left-style': {
        keys: ['bl', 'border-left'],
        values: BORDER_STYLE_VALUES,
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-right-style': {
        keys: ['br', 'border-right'],
        values: BORDER_STYLE_VALUES,
        ambiguous: true,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-x-style': {
        keys: ['bx', 'border-x'],
        values: BORDER_STYLE_VALUES,
        ambiguous: true,
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-left-style': value,
                'border-right-style': value
            }
        }
    } as RuleDefinition,
    'border-y-style': {
        keys: ['by', 'border-y'],
        values: BORDER_STYLE_VALUES,
        ambiguous: true,
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-top-style': value,
                'border-bottom-style': value
            }
        }
    } as RuleDefinition,
    'border-style': {
        keys: ['b'],
        values: BORDER_STYLE_VALUES,
        ambiguous: true,
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    // border width
    'border-top-width': {
        keys: ['bt'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-bottom-width': {
        keys: ['bb'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-left-width': {
        keys: ['bl'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-right-width': {
        keys: ['br'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-x-width': {
        keys: ['bx'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-left-width': value,
                'border-right-width': value
            }
        }
    } as RuleDefinition,
    'border-y-width': {
        keys: ['by'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-top-width': value,
                'border-bottom-width': value
            }
        }
    } as RuleDefinition,
    'border-width': {
        keys: ['b'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    // border image
    'border-image-outset': {
        keys: ['border-image'],
        ambiguous: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image-repeat': {
        keys: ['border'],
        values: ['stretch', 'repeat', 'round', 'space'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image-slice': {
        keys: ['border'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image-source': {
        keys: ['border'],
        values: ['url', 'linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image-width': {
        keys: ['border'],
        values: ['auto'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image': {
        keys: ['border'],
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    // border
    'border-top': {
        keys: ['bt'],
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-bottom': {
        keys: ['bb'],
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-left': {
        keys: ['bl'],
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-right': {
        keys: ['br'],
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-x': {
        keys: ['bx'],
        unit: 'rem',
        colored: true,
        layer: Layer.CoreShorthand,
        transformValueComponents: autofillSolidToValueComponent,
        declare(value) {
            return {
                'border-left': value,
                'border-right': value
            }
        }
    } as RuleDefinition,
    'border-y': {
        keys: ['by'],
        unit: 'rem',
        colored: true,
        layer: Layer.CoreShorthand,
        transformValueComponents: autofillSolidToValueComponent,
        declare(value) {
            return {
                'border-top': value,
                'border-bottom': value
            }
        }
    } as RuleDefinition,
    border: {
        keys: ['b'],
        unit: 'rem',
        colored: true,
        layer: Layer.CoreNativeShorthand,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'background-attachment': {
        keys: ['bg'],
        values: ['fixed', 'local', 'scroll'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-blend-mode': {
        keys: ['bg-blend'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-color': {
        keys: ['bg'],
        layer: Layer.CoreNative,
        ambiguous: true,
        colored: true
    } as RuleDefinition,
    'background-clip': {
        keys: ['bg-clip'],
        // todo: text should be listed in completion list
        // values: ['text'],
        layer: Layer.CoreNative,
        declare(value) {
            return {
                '-webkit-background-clip': value,
                'background-clip': value
            }
        }
    } as RuleDefinition,
    'background-origin': {
        keys: ['bg-origin'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-position': {
        keys: ['bg'],
        values: ['top', 'bottom', 'right', 'left', 'center'],
        ambiguous: true,
        layer: Layer.CoreNative,
        unit: 'px'
    } as RuleDefinition,
    'background-repeat': {
        keys: ['bg'],
        values: ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-size': {
        keys: ['bg'],
        values: ['auto', 'cover', 'contain'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-image': {
        // todo: resolve fn values
        match: ['(?:bg|background)', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    background: {
        keys: ['bg'],
        colored: true,
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    gradient: {
        // todo: resolve fn values
        match: /^gradient\(/,
        layer: Layer.CoreShorthand,
        colored: true,
        declare(value) {
            return {
                'background-image': 'linear-' + value
            }
        }
    } as RuleDefinition,
    'mix-blend-mode': {
        keys: ['blend'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'backdrop-filter': {
        keys: ['bd'],
        layer: Layer.CoreNative,
        colored: true,
        declare(value) {
            return {
                'backdrop-filter': value,
                '-webkit-backdrop-filter': value
            }
        }
    } as RuleDefinition,
    filter: {
        // todo: resolve fn
        match: /^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    fill: {
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'stroke-dasharray': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'stroke-dashoffset': {
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    'stroke-width': {
        keys: ['stroke'],
        ambiguous: true,
        numeric: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    stroke: {
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    x: {
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    y: {
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    cx: {
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    cy: {
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    rx: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    ry: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-column-start': {
        keys: ['grid-col-start'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-column-end': {
        keys: ['grid-col-end'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-column-span': {
        keys: ['grid-col-span'],
        layer: Layer.CoreShorthand,
        transformValue(value) {
            return 'span' + ' ' + value + '/' + 'span' + ' ' + value
        }
    } as RuleDefinition,
    'grid-column': {
        keys: ['grid-col'],
        layer: Layer.CoreNativeShorthand,
    } as RuleDefinition,
    'grid-columns': {
        keys: ['grid-cols'],
        declare(value) {
            return {
                display: 'grid',
                'grid-template-columns': 'repeat'
                    + '(' + value
                    + ','
                    + 'minmax'
                    + '(' + 0 + ',' + 1 + 'fr' + '))',
            }
        },
        layer: Layer.Core
    } as RuleDefinition,
    'grid-row-start': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-row-end': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-row-span': {
        layer: Layer.CoreShorthand,
        transformValue(value) {
            return 'span' + ' ' + value + '/' + 'span' + ' ' + value
        }
    } as RuleDefinition,
    'grid-row': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'grid-rows': {
        keys: ['grid-rows'],
        declare(value) {
            return {
                display: 'grid',
                'grid-auto-flow': 'column',
                'grid-template-rows': 'repeat'
                    + '(' + value
                    + ','
                    + 'minmax'
                    + '(' + 0 + ',' + 1 + 'fr' + '))',
            }
        },
        layer: Layer.Core
    } as RuleDefinition,
    'grid-auto-columns': {
        keys: ['grid-auto-cols'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-auto-flow': {
        keys: ['grid-flow'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-auto-rows': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-template-areas': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-template-columns': {
        keys: ['grid-template-cols'],
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleDefinition,
    'grid-template-rows': {
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleDefinition,
    'grid-template': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'grid-area': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    grid: {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'column-gap': {
        keys: ['gap-x'],
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    'row-gap': {
        keys: ['gap-y'],
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    gap: {
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    order: {
        keys: ['o'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'break-inside': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'break-before': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'break-after': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'aspect-ratio': {
        keys: ['aspect'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'column-span': {
        keys: ['col-span'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'align-content': {
        keys: ['align-content', 'ac'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'align-items': {
        keys: ['align-items', 'ai'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'align-self': {
        keys: ['align-self', 'as'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'justify-content': {
        keys: ['justify-content', 'jc'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'justify-items': {
        keys: ['justify-items', 'ji'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'justify-self': {
        keys: ['justify-self', 'js'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'place-content': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'place-items': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'place-self': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'list-style-position': {
        keys: ['list-style'],
        values: ['inside', 'outside'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'list-style-type': {
        keys: ['list-style'],
        values: ['disc', 'decimal'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'list-style-image': {
        // todo: resolve fn values
        match: ['list-style', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'list-style': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'outline-color': {
        keys: ['outline'],
        ambiguous: true,
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'outline-offset': {
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    'outline-style': {
        keys: ['outline'],
        values: BORDER_STYLE_VALUES,
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'outline-width': {
        keys: ['outline'],
        values: ['medium', 'thick', 'thin'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    outline: {
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        colored: true,
        variables: [
            'outline-width',
            'outline-style',
            'outline-offset',
            'outline-color'
        ],
        transformValueComponents: autofillSolidToValueComponent
    } as RuleDefinition,
    'accent-color': {
        keys: ['accent'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    appearance: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'caret-color': {
        keys: ['caret'],
        layer: Layer.CoreNative,
        colored: true,
        variables: ['text', 't']
    } as RuleDefinition,
    'scroll-behavior': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    // scroll margin
    'scroll-margin-left': {
        keys: ['scroll-ml'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-right': {
        keys: ['scroll-mr'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-top': {
        keys: ['scroll-mt'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-bottom': {
        keys: ['scroll-mb'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-x': {
        keys: ['scroll-mx'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'scroll-margin-left': value,
                'scroll-margin-right': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-y': {
        keys: ['scroll-my'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'scroll-margin-top': value,
                'scroll-margin-bottom': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin': {
        keys: ['scroll-m'],
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // scroll padding
    'scroll-padding-left': {
        keys: ['scroll-pl'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-right': {
        keys: ['scroll-pr'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-top': {
        keys: ['scroll-pt'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-bottom': {
        keys: ['scroll-pb'],
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-x': {
        keys: ['scroll-px'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'scroll-padding-left': value,
                'scroll-padding-right': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-y': {
        keys: ['scroll-py'],
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'scroll-padding-top': value,
                'scroll-padding-bottom': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding': {
        keys: ['scroll-p'],
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // scroll snap
    'scroll-snap-align': {
        keys: ['scroll-snap'],
        values: ['start', 'end', 'center'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'scroll-snap-stop': {
        keys: ['scroll-snap'],
        values: ['normal', 'always'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'scroll-snap-type': {
        keys: ['scroll-snap'],
        values: ['x', 'y', 'block', 'inline', 'both'],
        ambiguous: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'will-change': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'writing-mode': {
        keys: ['writing'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    direction: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'shape-outside': {
        // todo: resolve fn values
        match: ['shape', ['(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'shape-margin': {
        keys: ['shape'],
        ambiguous: true,
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    'shape-image-threshold': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'clip-path': {
        keys: ['clip'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    quotes: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'mask-image': {
        layer: Layer.CoreNative,
        declare(value) {
            return {
                'mask-image': value,
                '-webkit-mask-image': value
            }
        }
    } as RuleDefinition
}

export default rules