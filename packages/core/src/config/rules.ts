import cssEscape from 'shared/utils/css-escape'
import type { SyntaxRule } from '../syntax-rule'
import SyntaxRuleType from '../syntax-rule-type'
import { BORDER_STYLE_VALUES, COLOR_VALUE_REGEX, IMAGE_VALUE_REGEX, NUMBER_VALUE_REGEX, VALUE_DELIMITERS } from '../common'
import autofillSolidStyle from '../utils/autofill-solid-style'
import { SyntaxRuleDefinition } from '../types/config'

const rules = {
    group: {
        matcher: /^(?:.+?[*_>~+])?\{.+?\}/,
        type: SyntaxRuleType.Shorthand,
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
            const handleRule = (rule: SyntaxRule) => {
                const addProps = (cssText: string) => {
                    const cssProperties = cssText.slice(cssEscape(rule.name).length).match(/\{(.*)\}/)?.[1].split(';')
                    if (cssProperties)
                        for (const eachCssProperty of cssProperties) {
                            addProp(eachCssProperty)
                        }
                }

                for (const eachNative of rule.nodes) {
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
                const rules = this.css.generate(eachName, this.mode)
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
    } as SyntaxRuleDefinition,
    variable: {
        matcher: /^\$[\w-]+:/, // don't use 'rem' as default, because css variable is common API
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                ['--' + this.keyToken.slice(1, -1)]: value
            }
        }
    } as SyntaxRuleDefinition,
    'font-size': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'font-weight': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['bolder'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'font-family': {
        ambiguousKeys: ['font', 'f'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'font-smoothing': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['antialiased', 'subpixel-antialiased'],
        type: SyntaxRuleType.Native,
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
    } as SyntaxRuleDefinition,
    'font-style': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['normal', 'italic', 'oblique'],
        type: SyntaxRuleType.Native,
        unit: 'deg'
    } as SyntaxRuleDefinition,
    'font-variant-numeric': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'font-variant': {
        ambiguousKeys: ['font', 'f'],
        type: SyntaxRuleType.NativeShorthand,
    },
    font: {
        subkey: 'f',
        type: SyntaxRuleType.NativeShorthand,
        variables: [
            'font-family',
            'font-variant',
            'font-weight',
            'font-size',
            'font-style',
            'line-height'
        ]
    } as SyntaxRuleDefinition,
    'font-feature-settings': {
        key: 'font-feature',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    color: {
        key: 'fg',
        type: SyntaxRuleType.Native,
        variables: ['text']
    } as SyntaxRuleDefinition,
    // margin
    'margin-left': {
        key: 'ml',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'margin-right': {
        key: 'mr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'margin-top': {
        key: 'mt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'margin-bottom': {
        key: 'mb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'margin-x': {
        key: 'mx',
        subkey: 'margin-x',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'margin-left': value,
                'margin-right': value
            }
        },
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'margin-y': {
        key: 'my',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'margin-top': value,
                'margin-bottom': value
            }
        },
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    margin: {
        key: 'm',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    // margin inline
    'margin-inline-start': {
        key: 'mis',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'margin-inline-end': {
        key: 'mie',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'margin-inline': {
        key: 'mi',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    // padding
    'padding-left': {
        key: 'pl',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'padding-right': {
        key: 'pr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'padding-top': {
        key: 'pt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'padding-bottom': {
        key: 'pb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'padding-x': {
        key: 'px',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'padding-left': value,
                'padding-right': value
            }
        },
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'padding-y': {
        key: 'py',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'padding-top': value,
                'padding-bottom': value
            }
        },
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    padding: {
        key: 'p',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    // padding inline
    'padding-inline-start': {
        key: 'pis',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'padding-inline-end': {
        key: 'pie',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'padding-inline': {
        key: 'pi',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    // flex
    'flex-basis': {
        ambiguousKeys: ['flex'],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'flex-wrap': {
        ambiguousKeys: ['flex'],
        ambiguousValues: ['wrap', 'nowrap', 'wrap-reverse'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'flex-grow': {
        ambiguousKeys: ['flex'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'flex-shrink': {
        ambiguousKeys: ['flex'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'flex-direction': {
        ambiguousKeys: ['flex'],
        ambiguousValues: ['row', 'row-reverse', 'column', 'column-reverse'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    flex: {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    display: {
        key: 'd',
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    width: {
        key: 'w',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    height: {
        key: 'h',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'min-width': {
        key: 'min-w',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'min-height': {
        key: 'min-h',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    size: {
        type: SyntaxRuleType.Shorthand,
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
    } as SyntaxRuleDefinition,
    'min-size': {
        key: 'min',
        type: SyntaxRuleType.Shorthand,
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
    } as SyntaxRuleDefinition,
    'max-size': {
        key: 'max',
        type: SyntaxRuleType.Shorthand,
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
    } as SyntaxRuleDefinition,
    'box-sizing': {
        ambiguousKeys: ['box'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'box-decoration-break': {
        key: 'box-decoration',
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-box-decoration-break': value,
                'box-decoration-break': value,
            }
        }
    } as SyntaxRuleDefinition,
    contain: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    content: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'counter-increment': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'counter-reset': {
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'letter-spacing': {
        key: 'tracking',
        subkey: 'ls',
        type: SyntaxRuleType.Native,
        unit: 'em'
    } as SyntaxRuleDefinition,
    'line-height': {
        key: 'leading',
        subkey: 'line-h',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'object-fit': {
        ambiguousKeys: ['object', 'obj'],
        ambiguousValues: ['contain', 'cover', 'fill', 'scale-down'],
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'object-position': {
        ambiguousKeys: ['object', 'obj'],
        ambiguousValues: ['top', 'bottom', 'right', 'left', 'center'],
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'text-align': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['justify', 'center', 'left', 'right', 'start', 'end'],
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'text-decoration-color': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['text']
    } as SyntaxRuleDefinition,
    'text-decoration-style': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: ['solid', 'double', 'dotted', 'dashed', 'wavy'],
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'text-decoration-thickness': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: ['from-font', NUMBER_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        unit: 'em'
    } as SyntaxRuleDefinition,
    'text-decoration-line': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: ['underline', 'overline', 'line-through'],
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'text-decoration': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['underline', 'overline', 'line-through'],
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['text'],
        declare(value) {
            return {
                '-webkit-text-decoration': value,
                'text-decoration': value,
            }
        },
    } as SyntaxRuleDefinition,
    'text-underline-offset': {
        ambiguousKeys: ['text-underline'],
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'text-underline-position': {
        ambiguousKeys: ['text-underline'],
        ambiguousValues: ['front-font', 'under', 'left', 'right'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'text-overflow': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['ellipsis', 'clip'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'text-orientation': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'text-transform': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['uppercase', 'lowercase', 'capitalize'],
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'text-rendering': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision'],
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'text-wrap': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['wrap', 'nowrap', 'balance', 'pretty'],
        type: SyntaxRuleType.NativeShorthand,
    } as SyntaxRuleDefinition,
    'text-indent': {
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'vertical-align': {
        key: 'v',
        subkey: 'vertical',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    columns: {
        key: 'cols',
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    'white-space': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    top: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    bottom: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    left: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    right: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    inset: {
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'max-height': {
        key: 'max-h',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'max-width': {
        key: 'max-w',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    opacity: {
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    visibility: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    clear: {
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    float: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    isolation: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'overflow-x': {
        type: SyntaxRuleType.Native,
        declare(value) {
            return value === 'overlay'
                ? { 'overflow-x': ['auto', value] }
                : { 'overflow-x': value }
        }
    } as SyntaxRuleDefinition,
    'overflow-y': {
        type: SyntaxRuleType.Native,
        declare(value) {
            return value === 'overlay'
                ? { 'overflow-y': ['auto', value] }
                : { 'overflow-y': value }
        }
    } as SyntaxRuleDefinition,
    overflow: {
        type: SyntaxRuleType.NativeShorthand,
        declare(value) {
            return value === 'overlay'
                ? { overflow: ['auto', value] }
                : { overflow: value }
        }
    } as SyntaxRuleDefinition,
    'overscroll-behavior-x': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'overscroll-behavior-y': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'overscroll-behavior': {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    'z-index': {
        key: 'z',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    position: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    cursor: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'pointer-events': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    resize: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'touch-action': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'word-break': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'word-spacing': {
        type: SyntaxRuleType.Native,
        unit: 'em'
    } as SyntaxRuleDefinition,
    hyphens: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'user-drag': {
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-user-drag': value,
                'user-drag': value,
            }
        }
    } as SyntaxRuleDefinition,
    'user-select': {
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-user-select': value,
                'user-select': value,
            }
        }
    } as SyntaxRuleDefinition,
    'text-shadow': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
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
        },
        type: SyntaxRuleType.Shorthand
    } as SyntaxRuleDefinition,
    'text-fill-color': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['text'],
        declare(value) {
            return {
                '-webkit-text-fill-color': value
            }
        }
    } as SyntaxRuleDefinition,
    'text-stroke-width': {
        ambiguousKeys: ['text-stroke'],
        ambiguousValues: ['thin', 'medium', 'thick', NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-text-stroke-width': value
            }
        },
    } as SyntaxRuleDefinition,
    'text-stroke-color': {
        ambiguousKeys: ['text-stroke'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-text-stroke-color': value
            }
        }
    } as SyntaxRuleDefinition,
    'text-stroke': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-text-stroke': value
            }
        }
    } as SyntaxRuleDefinition,
    'text-truncate': {
        subkey: 'lines',
        declare(value) {
            return {
                display: '-webkit-box',
                '-webkit-box-orient': 'vertical',
                '-webkit-line-clamp': value,
                overflow: 'hidden',
                'overflow-wrap': 'break-word',
                'text-overflow': 'ellipsis',
            }
        },
        type: SyntaxRuleType.Shorthand,
    } as SyntaxRuleDefinition,
    'box-shadow': {
        key: 'shadow',
        subkey: 's',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'table-layout': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'transform-box': {
        ambiguousKeys: ['transform'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'transform-style': {
        ambiguousKeys: ['transform'],
        ambiguousValues: ['flat', 'preserve-3d'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'transform-origin': {
        ambiguousKeys: ['transform'],
        ambiguousValues: ['top', 'bottom', 'right', 'left', 'center', NUMBER_VALUE_REGEX],
        unit: 'px',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    transform: {
        matcher: /^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\(/,
        type: SyntaxRuleType.Native,
        analyze(className: string) {
            return [className.startsWith('transform') ? className.slice(10) : className]
        },
        unit: 'px',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'transition-property': {
        key: '~property',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'transition-timing-function': {
        key: '~easing',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'transition-duration': {
        key: '~duration',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    } as SyntaxRuleDefinition,
    'transition-delay': {
        key: '~delay',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    } as SyntaxRuleDefinition,
    transition: {
        sign: '~',
        analyze(className: string) {
            if (className.startsWith('~')) {
                return [className.slice(1)]
            } else {
                const indexOfColon = className.indexOf(':')
                this.keyToken = className.slice(0, indexOfColon + 1)
                return [className.slice(indexOfColon + 1)]
            }
        },
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    'animation-delay': {
        key: '@delay',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    } as SyntaxRuleDefinition,
    'animation-direction': {
        key: '@direction',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'animation-duration': {
        key: '@duration',
        type: SyntaxRuleType.Native,
        unit: 'ms'
    } as SyntaxRuleDefinition,
    'animation-fill-mode': {
        key: '@fill',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'animation-iteration-count': {
        key: '@iteration',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'animation-name': {
        key: '@name',
        type: SyntaxRuleType.Native,
        includeAnimations: true
    } as SyntaxRuleDefinition,
    'animation-play-state': {
        key: '@play',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'animation-timing-function': {
        key: '@easing',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    animation: {
        sign: '@',
        type: SyntaxRuleType.NativeShorthand,
        includeAnimations: true,
        analyze(className: string) {
            if (className.startsWith('@')) {
                return [className.slice(1)]
            } else {
                const indexOfColon = className.indexOf(':')
                this.keyToken = className.slice(0, indexOfColon + 1)
                return [className.slice(indexOfColon + 1)]
            }
        }
    } as SyntaxRuleDefinition,
    'border-collapse': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: ['collapse', 'separate'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-spacing': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    // border color
    'border-top-color': {
        ambiguousKeys: ['bt', 'border-top'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'border-bottom-color': {
        ambiguousKeys: ['bb', 'border-bottom'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'border-left-color': {
        ambiguousKeys: ['bl', 'border-left'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'border-right-color': {
        ambiguousKeys: ['br', 'border-right'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'border-x-color': {
        ambiguousKeys: ['bx', 'border-x'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Shorthand,
        variables: ['frame'],
        declare(value) {
            return {
                'border-left-color': value,
                'border-right-color': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-y-color': {
        ambiguousKeys: ['by', 'border-y'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Shorthand,
        variables: ['frame'],
        declare(value) {
            return {
                'border-top-color': value,
                'border-bottom-color': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-color': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.NativeShorthand,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    // border radius
    'border-top-left-radius': {
        key: 'rtl',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-top-right-radius': {
        key: 'rtr',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-bottom-left-radius': {
        key: 'rbl',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-bottom-right-radius': {
        key: 'rbr',
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-top-radius': {
        key: 'rt',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-top-left-radius': value,
                'border-top-right-radius': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-bottom-radius': {
        key: 'rb',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-bottom-left-radius': value,
                'border-bottom-right-radius': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-left-radius': {
        key: 'rl',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-top-left-radius': value,
                'border-bottom-left-radius': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-right-radius': {
        key: 'rr',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-top-right-radius': value,
                'border-bottom-right-radius': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-radius': {
        key: 'r',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    // border style
    'border-top-style': {
        ambiguousKeys: ['bt', 'border-top'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'border-bottom-style': {
        ambiguousKeys: ['bb', 'border-bottom'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'border-left-style': {
        ambiguousKeys: ['bl', 'border-left'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'border-right-style': {
        ambiguousKeys: ['br', 'border-right'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'border-x-style': {
        ambiguousKeys: ['bx', 'border-x'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-left-style': value,
                'border-right-style': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-y-style': {
        ambiguousKeys: ['by', 'border-y'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-top-style': value,
                'border-bottom-style': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-style': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    // border width
    'border-top-width': {
        ambiguousKeys: ['bt', 'border-top'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'border-bottom-width': {
        ambiguousKeys: ['bb', 'border-bottom'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'border-left-width': {
        ambiguousKeys: ['bl', 'border-left'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'border-right-width': {
        ambiguousKeys: ['br', 'border-right'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'border-x-width': {
        ambiguousKeys: ['bx', 'border-x'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-left-width': value,
                'border-right-width': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-y-width': {
        ambiguousKeys: ['by', 'border-y'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-top-width': value,
                'border-bottom-width': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-width': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    // border image
    'border-image-repeat': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: ['stretch', 'repeat', 'round', 'space'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-image-slice': {
        ambiguousKeys: ['border-image'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-image-source': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: [IMAGE_VALUE_REGEX],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-image-width': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: ['auto', NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-image-outset': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'border-image': {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    // border
    'border-top': {
        key: 'bt',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'border-bottom': {
        key: 'bb',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'border-left': {
        key: 'bl',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'border-right': {
        key: 'br',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'border-x': {
        key: 'bx',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
        declare(value) {
            return {
                'border-left': value,
                'border-right': value
            }
        }
    } as SyntaxRuleDefinition,
    'border-y': {
        key: 'by',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
        declare(value) {
            return {
                'border-top': value,
                'border-bottom': value
            }
        }
    } as SyntaxRuleDefinition,
    border: {
        key: 'b',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'background-attachment': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['fixed', 'local', 'scroll'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'background-blend-mode': {
        key: 'bg-blend',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'background-color': {
        ambiguousKeys: ['bg'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'background-clip': {
        key: 'bg-clip',
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-background-clip': value,
                'background-clip': value
            }
        }
    } as SyntaxRuleDefinition,
    'background-origin': {
        key: 'bg-origin',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'background-position': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['top', 'bottom', 'right', 'left', 'center'],
        type: SyntaxRuleType.Native,
        unit: 'px'
    } as SyntaxRuleDefinition,
    'background-repeat': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'background-size': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['auto', 'cover', 'contain', NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'background-image': {
        ambiguousKeys: ['bg'],
        ambiguousValues: [IMAGE_VALUE_REGEX],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    background: {
        key: 'bg',
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    gradient: {
        matcher: /^gradient\(/,
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'background-image': 'linear-' + value
            }
        }
    } as SyntaxRuleDefinition,
    'mix-blend-mode': {
        key: 'blend',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'backdrop-filter': {
        key: 'bd',
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-backdrop-filter': value,
                'backdrop-filter': value,
            }
        }
    } as SyntaxRuleDefinition,
    filter: {
        matcher: /^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/,
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    fill: {
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    'stroke-dasharray': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'stroke-dashoffset': {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'stroke-width': {
        ambiguousKeys: ['stroke'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    stroke: {
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    x: {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    y: {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    cx: {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    cy: {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    rx: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    ry: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'grid-column-start': {
        key: 'grid-col-start',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'grid-column-end': {
        key: 'grid-col-end',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'grid-column-span': {
        key: 'grid-col-span',
        type: SyntaxRuleType.Shorthand,
        transformValue(value) {
            return 'span' + ' ' + value + '/' + 'span' + ' ' + value
        },
        declare(value) {
            return {
                'grid-column': value
            }
        },
    } as SyntaxRuleDefinition,
    'grid-column': {
        key: 'grid-col',
        type: SyntaxRuleType.NativeShorthand,
    } as SyntaxRuleDefinition,
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
        type: SyntaxRuleType.Shorthand
    } as SyntaxRuleDefinition,
    'grid-row-start': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'grid-row-end': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'grid-row-span': {
        type: SyntaxRuleType.Shorthand,
        transformValue(value) {
            return 'span' + ' ' + value + '/' + 'span' + ' ' + value
        },
        declare(value) {
            return {
                'grid-row': value
            }
        }
    } as SyntaxRuleDefinition,
    'grid-row': {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
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
        type: SyntaxRuleType.Shorthand
    } as SyntaxRuleDefinition,
    'grid-auto-columns': {
        key: 'grid-auto-cols',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'grid-auto-flow': {
        key: 'grid-flow',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'grid-auto-rows': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'grid-template-areas': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'grid-template-columns': {
        key: 'grid-template-cols',
        type: SyntaxRuleType.Native,
        unit: 'rem'
    } as SyntaxRuleDefinition,
    'grid-template-rows': {
        type: SyntaxRuleType.Native,
        unit: 'rem'
    } as SyntaxRuleDefinition,
    'grid-template': {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    'grid-area': {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    grid: {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    'column-gap': {
        key: 'gap-x',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'row-gap': {
        key: 'gap-y',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    gap: {
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    order: {
        key: 'o',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'break-inside': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'break-before': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'break-after': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'aspect-ratio': {
        key: 'aspect',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'column-span': {
        key: 'col-span',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'align-content': {
        subkey: 'ac',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'align-items': {
        subkey: 'ai',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'align-self': {
        subkey: 'as',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'justify-content': {
        subkey: 'jc',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'justify-items': {
        subkey: 'ji',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'justify-self': {
        subkey: 'js',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'place-content': {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    'place-items': {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    'place-self': {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    'list-style-position': {
        ambiguousKeys: ['list-style'],
        ambiguousValues: ['inside', 'outside'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'list-style-type': {
        ambiguousKeys: ['list-style'],
        ambiguousValues: ['disc', 'decimal'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'list-style-image': {
        ambiguousKeys: ['list-style'],
        ambiguousValues: [IMAGE_VALUE_REGEX],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'list-style': {
        type: SyntaxRuleType.NativeShorthand
    } as SyntaxRuleDefinition,
    'outline-color': {
        ambiguousKeys: ['outline'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    } as SyntaxRuleDefinition,
    'outline-offset': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'outline-style': {
        ambiguousKeys: ['outline'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'outline-width': {
        ambiguousKeys: ['outline'],
        ambiguousValues: ['medium', 'thick', 'thin', NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    outline: {
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: [
            'outline-width',
            'outline-style',
            'outline-offset',
            'outline-color',
            'frame'
        ],
        transformValueComponents: autofillSolidStyle
    } as SyntaxRuleDefinition,
    'accent-color': {
        key: 'accent',
        type: SyntaxRuleType.Native,
    } as SyntaxRuleDefinition,
    appearance: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'caret-color': {
        key: 'caret',
        type: SyntaxRuleType.Native,
        variables: ['text']
    } as SyntaxRuleDefinition,
    'scroll-behavior': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    // scroll margin
    'scroll-margin-left': {
        key: 'scroll-ml',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-margin-right': {
        key: 'scroll-mr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-margin-top': {
        key: 'scroll-mt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-margin-bottom': {
        key: 'scroll-mb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-margin-x': {
        key: 'scroll-mx',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'scroll-margin-left': value,
                'scroll-margin-right': value
            }
        },
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-margin-y': {
        key: 'scroll-my',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'scroll-margin-top': value,
                'scroll-margin-bottom': value
            }
        },
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-margin': {
        key: 'scroll-m',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    // scroll padding
    'scroll-padding-left': {
        key: 'scroll-pl',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-padding-right': {
        key: 'scroll-pr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-padding-top': {
        key: 'scroll-pt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-padding-bottom': {
        key: 'scroll-pb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-padding-x': {
        key: 'scroll-px',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'scroll-padding-left': value,
                'scroll-padding-right': value
            }
        },
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-padding-y': {
        key: 'scroll-py',
        unit: 'rem',
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'scroll-padding-top': value,
                'scroll-padding-bottom': value
            }
        },
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'scroll-padding': {
        key: 'scroll-p',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    // scroll snap
    'scroll-snap-align': {
        ambiguousKeys: ['scroll-snap'],
        ambiguousValues: ['start', 'end', 'center'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'scroll-snap-stop': {
        ambiguousKeys: ['scroll-snap'],
        ambiguousValues: ['normal', 'always'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'scroll-snap-type': {
        ambiguousKeys: ['scroll-snap'],
        ambiguousValues: ['x', 'y', 'block', 'inline', 'both'],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'will-change': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'writing-mode': {
        key: 'writing',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    direction: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'shape-outside': {
        ambiguousKeys: ['shape'],
        ambiguousValues: [/(?:inset|circle|ellipse|polygon|url|linear-gradient)\(.*\)/],
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'shape-margin': {
        ambiguousKeys: ['shape'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    } as SyntaxRuleDefinition,
    'shape-image-threshold': {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'clip-path': {
        key: 'clip',
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    quotes: {
        type: SyntaxRuleType.Native
    } as SyntaxRuleDefinition,
    'mask-image': {
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-mask-image': value,
                'mask-image': value,
            }
        }
    } as SyntaxRuleDefinition
}

export default rules