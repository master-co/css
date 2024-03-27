import cssEscape from 'css-shared/utils/css-escape'
import type { Rule, RuleDefinition } from '../rule'
import Layer from '../layer'
import { COLOR_VALUE_REGEX, IMAGE_VALUE_REGEX, NUMBER_VALUE_REGEX, VALUE_DELIMITERS } from '../common'

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

const rules = {
    group: {
        match: /^(?:.+?[*_>~+])?\{.+?\}/,
        layer: Layer.Normal,
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
        layer: Layer.Normal,
        declare(value) {
            return {
                ['--' + this.keyToken.slice(1, -1)]: value
            }
        }
    } as RuleDefinition,
    'font-size': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'font-weight': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['bolder'],
        layer: Layer.Native
    } as RuleDefinition,
    'font-family': {
        ambiguousKeys: ['font', 'f'],
        layer: Layer.Native
    } as RuleDefinition,
    'font-smoothing': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['antialiased', 'subpixel-antialiased'],
        layer: Layer.Native,
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
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['normal', 'italic', 'oblique'],
        layer: Layer.Native,
        unit: 'deg'
    } as RuleDefinition,
    'font-variant-numeric': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions'],
        layer: Layer.Native
    } as RuleDefinition,
    'font-variant': {
        ambiguousKeys: ['font', 'f'],
        layer: Layer.NativeShorthand,
    },
    font: {
        subkey: 'f',
        layer: Layer.NativeShorthand,
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
        key: 'font-feature',
        layer: Layer.Native
    } as RuleDefinition,
    color: {
        key: 'fg',
        layer: Layer.Native,
        variables: ['text']
    } as RuleDefinition,
    // margin
    'margin-left': {
        key: 'ml',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-right': {
        key: 'mr',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-top': {
        key: 'mt',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-bottom': {
        key: 'mb',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-x': {
        key: 'mx',
        subkey: 'margin-x',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'margin-left': value,
                'margin-right': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'margin-y': {
        key: 'my',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'margin-top': value,
                'margin-bottom': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    margin: {
        key: 'm',
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // margin inline
    'margin-inline-start': {
        key: 'mis',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-inline-end': {
        key: 'mie',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-inline': {
        key: 'mi',
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // padding
    'padding-left': {
        key: 'pl',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-right': {
        key: 'pr',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-top': {
        key: 'pt',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-bottom': {
        key: 'pb',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-x': {
        key: 'px',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'padding-left': value,
                'padding-right': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'padding-y': {
        key: 'py',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'padding-top': value,
                'padding-bottom': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    padding: {
        key: 'p',
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // padding inline
    'padding-inline-start': {
        key: 'pis',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-inline-end': {
        key: 'pie',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-inline': {
        key: 'pi',
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // flex
    'flex-basis': {
        ambiguousKeys: ['flex'],
        unit: 'rem',
        layer: Layer.Native,
    } as RuleDefinition,
    'flex-wrap': {
        ambiguousKeys: ['flex'],
        ambiguousValues: ['wrap', 'nowrap', 'wrap-reverse'],
        layer: Layer.Native
    } as RuleDefinition,
    'flex-grow': {
        ambiguousKeys: ['flex'],
        layer: Layer.Native
    } as RuleDefinition,
    'flex-shrink': {
        ambiguousKeys: ['flex'],
        layer: Layer.Native
    } as RuleDefinition,
    'flex-direction': {
        ambiguousKeys: ['flex'],
        ambiguousValues: ['row', 'row-reverse', 'column', 'column-reverse'],
        layer: Layer.Native
    } as RuleDefinition,
    flex: {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    display: {
        key: 'd',
        layer: Layer.Native,
    } as RuleDefinition,
    width: {
        key: 'w',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    height: {
        key: 'h',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'min-width': {
        key: 'min-w',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'min-height': {
        key: 'min-h',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    size: {
        layer: Layer.Shorthand,
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
        key: 'min',
        layer: Layer.Shorthand,
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
        key: 'max',
        layer: Layer.Shorthand,
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
        ambiguousKeys: ['box'],
        layer: Layer.Native
    } as RuleDefinition,
    'box-decoration-break': {
        key: 'box-decoration',
        layer: Layer.Native,
        declare(value) {
            return {
                'box-decoration-break': value,
                '-webkit-box-decoration-break': value
            }
        }
    } as RuleDefinition,
    contain: {
        layer: Layer.Native
    } as RuleDefinition,
    content: {
        layer: Layer.Native
    } as RuleDefinition,
    'counter-increment': {
        layer: Layer.Native
    } as RuleDefinition,
    'counter-reset': {
        layer: Layer.Native,
    } as RuleDefinition,
    'letter-spacing': {
        key: 'tracking',
        subkey: 'ls',
        layer: Layer.Native,
        unit: 'em'
    } as RuleDefinition,
    'line-height': {
        key: 'leading',
        subkey: 'line-h',
        layer: Layer.Native
    } as RuleDefinition,
    'object-fit': {
        ambiguousKeys: ['object', 'obj'],
        ambiguousValues: ['contain', 'cover', 'fill', 'scale-down'],
        layer: Layer.Native,
    } as RuleDefinition,
    'object-position': {
        ambiguousKeys: ['object', 'obj'],
        ambiguousValues: ['top', 'bottom', 'right', 'left', 'center'],
        layer: Layer.Native,
    } as RuleDefinition,
    'text-align': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['justify', 'center', 'left', 'right', 'start', 'end'],
        layer: Layer.Native,
    } as RuleDefinition,
    'text-decoration-color': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Native,
        variables: ['text']
    } as RuleDefinition,
    'text-decoration-style': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: ['solid', 'double', 'dotted', 'dashed', 'wavy'],
        layer: Layer.Native,
    } as RuleDefinition,
    'text-decoration-thickness': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: ['from-font', NUMBER_VALUE_REGEX],
        layer: Layer.Native,
        unit: 'em'
    } as RuleDefinition,
    'text-decoration-line': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: ['underline', 'overline', 'line-through'],
        layer: Layer.Native,
    } as RuleDefinition,
    'text-decoration': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['underline', 'overline', 'line-through'],
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: ['text'],
        declare(value) {
            return {
                '-webkit-text-decoration': value,
                'text-decoration': value,
            }
        },
    } as RuleDefinition,
    'text-underline-offset': {
        ambiguousKeys: ['text-underline'],
        unit: 'rem',
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    'text-underline-position': {
        ambiguousKeys: ['text-underline'],
        ambiguousValues:['front-font', 'under', 'left', 'right'],
        layer: Layer.Native
    } as RuleDefinition,
    'text-overflow': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['ellipsis', 'clip'],
        layer: Layer.Native
    } as RuleDefinition,
    'text-orientation': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation'],
        layer: Layer.Native
    } as RuleDefinition,
    'text-transform': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['uppercase', 'lowercase', 'capitalize'],
        layer: Layer.Native,
    } as RuleDefinition,
    'text-rendering': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['optimizespeed', 'optimizelegibility', 'geometricprecision'],
        layer: Layer.Native,
    } as RuleDefinition,
    'text-indent': {
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'vertical-align': {
        key: 'v',
        subkey: 'vertical',
        layer: Layer.Native
    } as RuleDefinition,
    columns: {
        key: 'cols',
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'white-space': {
        layer: Layer.Native
    } as RuleDefinition,
    top: {
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    bottom: {
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    left: {
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    right: {
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    inset: {
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // todo: truncate:1 truncate:2
    lines: {
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
        key: 'max-h',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'max-width': {
        key: 'max-w',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    opacity: {
        layer: Layer.Native,
    } as RuleDefinition,
    visibility: {
        layer: Layer.Native
    } as RuleDefinition,
    clear: {
        layer: Layer.Native,
    } as RuleDefinition,
    float: {
        layer: Layer.Native
    } as RuleDefinition,
    isolation: {
        layer: Layer.Native
    } as RuleDefinition,
    'overflow-x': {
        layer: Layer.Native,
        declare(value) {
            return value === 'overlay'
                ? { 'overflow-x': ['auto', value] }
                : { 'overflow-x': value }
        }
    } as RuleDefinition,
    'overflow-y': {
        layer: Layer.Native,
        declare(value) {
            return value === 'overlay'
                ? { 'overflow-y': ['auto', value] }
                : { 'overflow-y': value }
        }
    } as RuleDefinition,
    overflow: {
        layer: Layer.NativeShorthand,
        declare(value) {
            return value === 'overlay'
                ? { overflow: ['auto', value] }
                : { overflow: value }
        }
    } as RuleDefinition,
    'overscroll-behavior-x': {
        layer: Layer.Native
    } as RuleDefinition,
    'overscroll-behavior-y': {
        layer: Layer.Native
    } as RuleDefinition,
    'overscroll-behavior': {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'z-index': {
        key: 'z',
        layer: Layer.Native
    } as RuleDefinition,
    position: {
        layer: Layer.Native
    } as RuleDefinition,
    cursor: {
        layer: Layer.Native
    } as RuleDefinition,
    'pointer-events': {
        layer: Layer.Native
    } as RuleDefinition,
    resize: {
        layer: Layer.Native
    } as RuleDefinition,
    'touch-action': {
        layer: Layer.Native
    } as RuleDefinition,
    'word-break': {
        layer: Layer.Native
    } as RuleDefinition,
    'word-spacing': {
        layer: Layer.Native,
        unit: 'em'
    } as RuleDefinition,
    'user-drag': {
        layer: Layer.Native,
        declare(value) {
            return {
                'user-drag': value,
                '-webkit-user-drag': value
            }
        }
    } as RuleDefinition,
    'user-select': {
        layer: Layer.Native,
        declare(value) {
            return {
                'user-select': value,
                '-webkit-user-select': value
            }
        }
    } as RuleDefinition,
    'text-shadow': {
        unit: 'rem',
        layer: Layer.Native,
    } as RuleDefinition,
    'text-size': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
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
        ambiguousKeys: ['text', 't'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Native,
        variables: ['text'],
        declare(value) {
            return {
                '-webkit-text-fill-color': value
            }
        }
    } as RuleDefinition,
    'text-stroke-width': {
        ambiguousKeys: ['text-stroke'],
        ambiguousValues: ['thin', 'medium', 'thick', NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native,
        declare(value) {
            return {
                '-webkit-text-stroke-width': value
            }
        },
    } as RuleDefinition,
    'text-stroke-color': {
        ambiguousKeys: ['text-stroke'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Native,
        variables: ['text'],
        declare(value) {
            return {
                '-webkit-text-stroke-color': value
            }
        }
    } as RuleDefinition,
    'text-stroke': {
        unit: 'rem',
        layer: Layer.Native,
        declare(value) {
            return {
                '-webkit-text-stroke': value
            }
        }
    } as RuleDefinition,
    'box-shadow': {
        key: 'shadow',
        subkey: 's',
        unit: 'rem',
        layer: Layer.Native,
    } as RuleDefinition,
    'table-layout': {
        layer: Layer.Native
    } as RuleDefinition,
    'transform-box': {
        ambiguousKeys: ['transform'],
        layer: Layer.Native
    } as RuleDefinition,
    'transform-style': {
        ambiguousKeys: ['transform'],
        ambiguousValues: ['flat', 'preserve-3d'],
        layer: Layer.Native
    } as RuleDefinition,
    'transform-origin': {
        ambiguousKeys: ['transform'],
        ambiguousValues: ['top', 'bottom', 'right', 'left', 'center', NUMBER_VALUE_REGEX],
        unit: 'px',
        layer: Layer.Native
    } as RuleDefinition,
    transform: {
        match: /^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\(/,
        layer: Layer.Native,
        analyze(className: string) {
            return [className.startsWith('transform') ? className.slice(10) : className]
        },
        variables: ['spacing']
    } as RuleDefinition,
    'transition-property': {
        key: '~property',
        layer: Layer.Native
    } as RuleDefinition,
    'transition-timing-function': {
        key: '~easing',
        layer: Layer.Native
    } as RuleDefinition,
    'transition-duration': {
        key: '~duration',
        layer: Layer.Native,
        unit: 'ms'
    } as RuleDefinition,
    'transition-delay': {
        key: '~delay',
        layer: Layer.Native,
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
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'animation-delay': {
        key: '@delay',
        layer: Layer.Native,
        unit: 'ms'
    } as RuleDefinition,
    'animation-direction': {
        key: '@direction',
        layer: Layer.Native
    } as RuleDefinition,
    'animation-duration': {
        key: '@duration',
        layer: Layer.Native,
        unit: 'ms'
    } as RuleDefinition,
    'animation-fill-mode': {
        key: '@fill',
        layer: Layer.Native
    } as RuleDefinition,
    'animation-iteration-count': {
        key: '@iteration',
        layer: Layer.Native
    } as RuleDefinition,
    'animation-name': {
        key: '@name',
        layer: Layer.Native
    } as RuleDefinition,
    'animation-play-state': {
        key: '@play',
        layer: Layer.Native
    } as RuleDefinition,
    'animation-timing-function': {
        key: '@easing',
        layer: Layer.Native
    } as RuleDefinition,
    animation: {
        match: /^@[^!*>+~:[@_]+\|/,
        layer: Layer.NativeShorthand,
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
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: ['collapse', 'separate'],
        layer: Layer.Native
    } as RuleDefinition,
    'border-spacing': {
        unit: 'rem',
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    // border color
    'border-top-color': {
        ambiguousKeys: ['bt', 'border-top'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Native,
    } as RuleDefinition,
    'border-bottom-color': {
        ambiguousKeys: ['bb', 'border-bottom'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Native,
    } as RuleDefinition,
    'border-left-color': {
        ambiguousKeys: ['bl', 'border-left'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Native,
    } as RuleDefinition,
    'border-right-color': {
        ambiguousKeys: ['br', 'border-right'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Native,
    } as RuleDefinition,
    'border-x-color': {
        ambiguousKeys: ['bx', 'border-x'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-left-color': value,
                'border-right-color': value
            }
        }
    } as RuleDefinition,
    'border-y-color': {
        ambiguousKeys: ['by', 'border-y'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-top-color': value,
                'border-bottom-color': value
            }
        }
    } as RuleDefinition,
    'border-color': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.NativeShorthand,
    } as RuleDefinition,
    // border radius
    'border-top-left-radius': {
        key: 'rtl',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'border-top-right-radius': {
        key: 'rtr',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'border-bottom-left-radius': {
        key: 'rbl',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'border-bottom-right-radius': {
        key: 'rbr',
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'border-top-radius': {
        key: 'rt',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-top-left-radius': value,
                'border-top-right-radius': value
            }
        }
    } as RuleDefinition,
    'border-bottom-radius': {
        key: 'rb',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-bottom-left-radius': value,
                'border-bottom-right-radius': value
            }
        }
    } as RuleDefinition,
    'border-left-radius': {
        key: 'rl',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-top-left-radius': value,
                'border-bottom-left-radius': value
            }
        }
    } as RuleDefinition,
    'border-right-radius': {
        key: 'rr',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-top-right-radius': value,
                'border-bottom-right-radius': value
            }
        }
    } as RuleDefinition,
    'border-radius': {
        key: 'r',
        unit: 'rem',
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    // border style
    'border-top-style': {
        ambiguousKeys: ['bt', 'border-top'],
        ambiguousValues: BORDER_STYLE_VALUES,
        layer: Layer.Native,
    } as RuleDefinition,
    'border-bottom-style': {
        ambiguousKeys: ['bb', 'border-bottom'],
        ambiguousValues: BORDER_STYLE_VALUES,
        layer: Layer.Native,
    } as RuleDefinition,
    'border-left-style': {
        ambiguousKeys: ['bl', 'border-left'],
        ambiguousValues: BORDER_STYLE_VALUES,
        layer: Layer.Native,
    } as RuleDefinition,
    'border-right-style': {
        ambiguousKeys: ['br', 'border-right'],
        ambiguousValues: BORDER_STYLE_VALUES,
        layer: Layer.Native,
    } as RuleDefinition,
    'border-x-style': {
        ambiguousKeys: ['bx', 'border-x'],
        ambiguousValues: BORDER_STYLE_VALUES,
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-left-style': value,
                'border-right-style': value
            }
        }
    } as RuleDefinition,
    'border-y-style': {
        ambiguousKeys: ['by', 'border-y'],
        ambiguousValues: BORDER_STYLE_VALUES,
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-top-style': value,
                'border-bottom-style': value
            }
        }
    } as RuleDefinition,
    'border-style': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: BORDER_STYLE_VALUES,
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    // border width
    'border-top-width': {
        ambiguousKeys: ['bt', 'border-top'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native,
    } as RuleDefinition,
    'border-bottom-width': {
        ambiguousKeys: ['bb', 'border-bottom'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native,
    } as RuleDefinition,
    'border-left-width': {
        ambiguousKeys: ['bl', 'border-left'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native,
    } as RuleDefinition,
    'border-right-width': {
        ambiguousKeys: ['br', 'border-right'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native,
    } as RuleDefinition,
    'border-x-width': {
        ambiguousKeys: ['bx', 'border-x'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-left-width': value,
                'border-right-width': value
            }
        }
    } as RuleDefinition,
    'border-y-width': {
        ambiguousKeys: ['by', 'border-y'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'border-top-width': value,
                'border-bottom-width': value
            }
        }
    } as RuleDefinition,
    'border-width': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    // border image
    'border-image-repeat': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: ['stretch', 'repeat', 'round', 'space'],
        layer: Layer.Native
    } as RuleDefinition,
    'border-image-slice': {
        ambiguousKeys: ['border-image'],
        layer: Layer.Native
    } as RuleDefinition,
    'border-image-source': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: [IMAGE_VALUE_REGEX],
        layer: Layer.Native
    } as RuleDefinition,
    'border-image-width': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: ['auto', NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'border-image-outset': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'border-image': {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    // border
    'border-top': {
        key: 'bt',
        layer: Layer.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-bottom': {
        key: 'bb',
        layer: Layer.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-left': {
        key: 'bl',
        layer: Layer.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-right': {
        key: 'br',
        layer: Layer.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-x': {
        key: 'bx',
        unit: 'rem',
        layer: Layer.Shorthand,
        transformValueComponents: autofillSolidToValueComponent,
        declare(value) {
            return {
                'border-left': value,
                'border-right': value
            }
        }
    } as RuleDefinition,
    'border-y': {
        key: 'by',
        unit: 'rem',
        layer: Layer.Shorthand,
        transformValueComponents: autofillSolidToValueComponent,
        declare(value) {
            return {
                'border-top': value,
                'border-bottom': value
            }
        }
    } as RuleDefinition,
    border: {
        key: 'b',
        unit: 'rem',
        layer: Layer.NativeShorthand,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'background-attachment': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['fixed', 'local', 'scroll'],
        layer: Layer.Native
    } as RuleDefinition,
    'background-blend-mode': {
        key: 'bg-blend',
        layer: Layer.Native
    } as RuleDefinition,
    'background-color': {
        ambiguousKeys: ['bg'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Native,
    } as RuleDefinition,
    'background-clip': {
        key: 'bg-clip',
        layer: Layer.Native,
        declare(value) {
            return {
                '-webkit-background-clip': value,
                'background-clip': value
            }
        }
    } as RuleDefinition,
    'background-origin': {
        key: 'bg-origin',
        layer: Layer.Native
    } as RuleDefinition,
    'background-position': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['top', 'bottom', 'right', 'left', 'center'],
        layer: Layer.Native,
        unit: 'px'
    } as RuleDefinition,
    'background-repeat': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'],
        layer: Layer.Native
    } as RuleDefinition,
    'background-size': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['auto', 'cover', 'contain', NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    'background-image': {
        ambiguousKeys: ['bg'],
        ambiguousValues: [IMAGE_VALUE_REGEX],
        layer: Layer.Native
    } as RuleDefinition,
    background: {
        key: 'bg',
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    gradient: {
        // todo: resolve fn values
        match: /^gradient\(/,
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'background-image': 'linear-' + value
            }
        }
    } as RuleDefinition,
    'mix-blend-mode': {
        key: 'blend',
        layer: Layer.Native
    } as RuleDefinition,
    'backdrop-filter': {
        key: 'bd',
        layer: Layer.Native,
        declare(value) {
            return {
                'backdrop-filter': value,
                '-webkit-backdrop-filter': value
            }
        }
    } as RuleDefinition,
    filter: {
        match: /^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/,
        layer: Layer.Native,
    } as RuleDefinition,
    fill: {
        layer: Layer.Native,
    } as RuleDefinition,
    'stroke-dasharray': {
        layer: Layer.Native
    } as RuleDefinition,
    'stroke-dashoffset': {
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    'stroke-width': {
        ambiguousKeys: ['stroke'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        layer: Layer.Native
    } as RuleDefinition,
    stroke: {
        layer: Layer.Native,
    } as RuleDefinition,
    x: {
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    y: {
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    cx: {
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    cy: {
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    rx: {
        layer: Layer.Native
    } as RuleDefinition,
    ry: {
        layer: Layer.Native
    } as RuleDefinition,
    'grid-column-start': {
        key: 'grid-col-start',
        layer: Layer.Native
    } as RuleDefinition,
    'grid-column-end': {
        key: 'grid-col-end',
        layer: Layer.Native
    } as RuleDefinition,
    'grid-column-span': {
        key: 'grid-col-span',
        layer: Layer.Shorthand,
        transformValue(value) {
            return 'span' + ' ' + value + '/' + 'span' + ' ' + value
        },
        declare(value) {
            return {
                'grid-column': value
            }
        },
    } as RuleDefinition,
    'grid-column': {
        key: 'grid-col',
        layer: Layer.NativeShorthand,
    } as RuleDefinition,
    'grid-columns': {
        key: 'grid-cols',
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
        layer: Layer.Normal
    } as RuleDefinition,
    'grid-row-start': {
        layer: Layer.Native
    } as RuleDefinition,
    'grid-row-end': {
        layer: Layer.Native
    } as RuleDefinition,
    'grid-row-span': {
        layer: Layer.Shorthand,
        transformValue(value) {
            return 'span' + ' ' + value + '/' + 'span' + ' ' + value
        },
        declare(value) {
            return {
                'grid-row': value
            }
        }
    } as RuleDefinition,
    'grid-row': {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'grid-rows': {
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
        layer: Layer.Normal
    } as RuleDefinition,
    'grid-auto-columns': {
        key: 'grid-auto-cols',
        layer: Layer.Native
    } as RuleDefinition,
    'grid-auto-flow': {
        key: 'grid-flow',
        layer: Layer.Native
    } as RuleDefinition,
    'grid-auto-rows': {
        layer: Layer.Native
    } as RuleDefinition,
    'grid-template-areas': {
        layer: Layer.Native
    } as RuleDefinition,
    'grid-template-columns': {
        key: 'grid-template-cols',
        layer: Layer.Native,
        unit: 'rem'
    } as RuleDefinition,
    'grid-template-rows': {
        layer: Layer.Native,
        unit: 'rem'
    } as RuleDefinition,
    'grid-template': {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'grid-area': {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    grid: {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'column-gap': {
        key: 'gap-x',
        unit: 'rem',
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    'row-gap': {
        key: 'gap-y',
        unit: 'rem',
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    gap: {
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    order: {
        key: 'o',
        layer: Layer.Native
    } as RuleDefinition,
    'break-inside': {
        layer: Layer.Native
    } as RuleDefinition,
    'break-before': {
        layer: Layer.Native
    } as RuleDefinition,
    'break-after': {
        layer: Layer.Native
    } as RuleDefinition,
    'aspect-ratio': {
        key: 'aspect',
        layer: Layer.Native
    } as RuleDefinition,
    'column-span': {
        key: 'col-span',
        layer: Layer.Native
    } as RuleDefinition,
    'align-content': {
        subkey: 'ac',
        layer: Layer.Native
    } as RuleDefinition,
    'align-items': {
        subkey: 'ai',
        layer: Layer.Native
    } as RuleDefinition,
    'align-self': {
        subkey: 'as',
        layer: Layer.Native
    } as RuleDefinition,
    'justify-content': {
        subkey: 'jc',
        layer: Layer.Native
    } as RuleDefinition,
    'justify-items': {
        subkey: 'ji',
        layer: Layer.Native
    } as RuleDefinition,
    'justify-self': {
        subkey: 'js',
        layer: Layer.Native
    } as RuleDefinition,
    'place-content': {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'place-items': {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'place-self': {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'list-style-position': {
        ambiguousKeys: ['list-style'],
        ambiguousValues: ['inside', 'outside'],
        layer: Layer.Native
    } as RuleDefinition,
    'list-style-type': {
        ambiguousKeys: ['list-style'],
        ambiguousValues: ['disc', 'decimal'],
        layer: Layer.Native
    } as RuleDefinition,
    'list-style-image': {
        ambiguousKeys: ['list-style'],
        ambiguousValues: [IMAGE_VALUE_REGEX],
        layer: Layer.Native
    } as RuleDefinition,
    'list-style': {
        layer: Layer.NativeShorthand
    } as RuleDefinition,
    'outline-color': {
        ambiguousKeys: ['outline'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        layer: Layer.Native,
    } as RuleDefinition,
    'outline-offset': {
        unit: 'rem',
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    'outline-style': {
        ambiguousKeys: ['outline'],
        ambiguousValues: BORDER_STYLE_VALUES,
        layer: Layer.Native
    } as RuleDefinition,
    'outline-width': {
        ambiguousKeys: ['outline'],
        ambiguousValues: ['medium', 'thick', 'thin', NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native
    } as RuleDefinition,
    outline: {
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: [
            'outline-width',
            'outline-style',
            'outline-offset',
            'outline-color'
        ],
        transformValueComponents: autofillSolidToValueComponent
    } as RuleDefinition,
    'accent-color': {
        key: 'accent',
        layer: Layer.Native,
    } as RuleDefinition,
    appearance: {
        layer: Layer.Native
    } as RuleDefinition,
    'caret-color': {
        key: 'caret',
        layer: Layer.Native,
        variables: ['text']
    } as RuleDefinition,
    'scroll-behavior': {
        layer: Layer.Native
    } as RuleDefinition,
    // scroll margin
    'scroll-margin-left': {
        key: 'scroll-ml',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-right': {
        key: 'scroll-mr',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-top': {
        key: 'scroll-mt',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-bottom': {
        key: 'scroll-mb',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-x': {
        key: 'scroll-mx',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'scroll-margin-left': value,
                'scroll-margin-right': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-y': {
        key: 'scroll-my',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'scroll-margin-top': value,
                'scroll-margin-bottom': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin': {
        key: 'scroll-m',
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // scroll padding
    'scroll-padding-left': {
        key: 'scroll-pl',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-right': {
        key: 'scroll-pr',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-top': {
        key: 'scroll-pt',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-bottom': {
        key: 'scroll-pb',
        layer: Layer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-x': {
        key: 'scroll-px',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'scroll-padding-left': value,
                'scroll-padding-right': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-y': {
        key: 'scroll-py',
        unit: 'rem',
        layer: Layer.Shorthand,
        declare(value) {
            return {
                'scroll-padding-top': value,
                'scroll-padding-bottom': value
            }
        },
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding': {
        key: 'scroll-p',
        unit: 'rem',
        layer: Layer.NativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // scroll snap
    'scroll-snap-align': {
        ambiguousKeys: ['scroll-snap'],
        ambiguousValues: ['start', 'end', 'center'],
        layer: Layer.Native
    } as RuleDefinition,
    'scroll-snap-stop': {
        ambiguousKeys: ['scroll-snap'],
        ambiguousValues: ['normal', 'always'],
        layer: Layer.Native
    } as RuleDefinition,
    'scroll-snap-type': {
        ambiguousKeys: ['scroll-snap'],
        ambiguousValues: ['x', 'y', 'block', 'inline', 'both'],
        layer: Layer.Native
    } as RuleDefinition,
    'will-change': {
        layer: Layer.Native
    } as RuleDefinition,
    'writing-mode': {
        key: 'writing',
        layer: Layer.Native
    } as RuleDefinition,
    direction: {
        layer: Layer.Native
    } as RuleDefinition,
    'shape-outside': {
        ambiguousKeys: ['shape'],
        ambiguousValues: [/(?:inset|circle|ellipse|polygon|url|linear-gradient)\(.*\)/],
        layer: Layer.Native
    } as RuleDefinition,
    'shape-margin': {
        ambiguousKeys: ['shape'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        layer: Layer.Native,
        variables: ['spacing']
    } as RuleDefinition,
    'shape-image-threshold': {
        layer: Layer.Native
    } as RuleDefinition,
    'clip-path': {
        layer: Layer.Native
    } as RuleDefinition,
    quotes: {
        layer: Layer.Native
    } as RuleDefinition,
    'mask-image': {
        layer: Layer.Native,
        declare(value) {
            return {
                'mask-image': value,
                '-webkit-mask-image': value
            }
        }
    } as RuleDefinition
}

export default rules