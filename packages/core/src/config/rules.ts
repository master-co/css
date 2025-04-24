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

                addProps(rule.text)

                // animation
                if (rule.animationNames) {
                    if (!this.animationNames) {
                        this.animationNames = new Set()
                    }
                    for (const eachKeyframeName of rule.animationNames) {
                        this.animationNames.add(eachKeyframeName)
                    }
                }

                // variable
                if (rule.variableNames) {
                    if (this.variableNames) {
                        for (const eachVariableName of rule.variableNames) {
                            this.variableNames.add(eachVariableName)
                        }
                    } else {
                        this.variableNames = new Set(rule.variableNames)
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
    },
    variable: {
        matcher: /^\$[\w-]+:/, // don't use 'rem' as default, because css variable is common API
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                ['--' + this.keyToken.slice(1, -1)]: value
            }
        }
    },
    'font-size': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'font-weight': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['bolder'],
        type: SyntaxRuleType.Native
    },
    'font-family': {
        ambiguousKeys: ['font', 'f'],
        type: SyntaxRuleType.Native
    },
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
                default:
                    return {
                        'font-smooth': value
                    }
            }
        }
    },
    'font-style': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['normal', 'italic', 'oblique'],
        type: SyntaxRuleType.Native,
        unit: 'deg'
    },
    'font-variant-numeric': {
        ambiguousKeys: ['font', 'f'],
        ambiguousValues: ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions'],
        type: SyntaxRuleType.Native
    },
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
    },
    'font-feature-settings': {
        key: 'font-feature',
        type: SyntaxRuleType.Native
    },
    color: {
        key: 'fg',
        type: SyntaxRuleType.Native,
        variables: ['text']
    },
    // margin
    'margin-left': {
        key: 'ml',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'margin-right': {
        key: 'mr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'margin-top': {
        key: 'mt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'margin-bottom': {
        key: 'mb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
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
    },
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
    },
    margin: {
        key: 'm',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    },
    // margin inline
    'margin-inline-start': {
        key: 'mis',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'margin-inline-end': {
        key: 'mie',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'margin-inline': {
        key: 'mi',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    },
    // padding
    'padding-left': {
        key: 'pl',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'padding-right': {
        key: 'pr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'padding-top': {
        key: 'pt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'padding-bottom': {
        key: 'pb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
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
    },
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
    },
    padding: {
        key: 'p',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    },
    // padding inline
    'padding-inline-start': {
        key: 'pis',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'padding-inline-end': {
        key: 'pie',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'padding-inline': {
        key: 'pi',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    },
    // flex
    'flex-basis': {
        ambiguousKeys: ['flex'],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'flex-wrap': {
        ambiguousKeys: ['flex'],
        ambiguousValues: ['wrap', 'nowrap', 'wrap-reverse'],
        type: SyntaxRuleType.Native
    },
    'flex-grow': {
        ambiguousKeys: ['flex'],
        type: SyntaxRuleType.Native
    },
    'flex-shrink': {
        ambiguousKeys: ['flex'],
        type: SyntaxRuleType.Native
    },
    'flex-direction': {
        ambiguousKeys: ['flex'],
        ambiguousValues: ['row', 'row-reverse', 'column', 'column-reverse'],
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
    },
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
    },
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
    },
    'box-sizing': {
        ambiguousKeys: ['box'],
        type: SyntaxRuleType.Native
    },
    'box-decoration-break': {
        key: 'box-decoration',
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-box-decoration-break': value,
                'box-decoration-break': value,
            } as any
        }
    },
    container: {
        type: SyntaxRuleType.NativeShorthand
    },
    'container-name': {
        type: SyntaxRuleType.Native
    },
    'container-type': {
        type: SyntaxRuleType.Native,
        ambiguousKeys: ['container'],
        ambiguousValues: ['size', 'inline-size', 'scroll-state'],
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
        ambiguousKeys: ['object', 'obj'],
        ambiguousValues: ['contain', 'cover', 'fill', 'scale-down'],
        type: SyntaxRuleType.Native,
    },
    'object-position': {
        ambiguousKeys: ['object', 'obj'],
        ambiguousValues: ['top', 'bottom', 'right', 'left', 'center'],
        type: SyntaxRuleType.Native,
    },
    'text-align': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['justify', 'center', 'left', 'right', 'start', 'end'],
        type: SyntaxRuleType.Native,
    },
    'text-decoration-color': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['text']
    },
    'text-decoration-style': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: ['solid', 'double', 'dotted', 'dashed', 'wavy'],
        type: SyntaxRuleType.Native,
    },
    'text-decoration-thickness': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: ['from-font', NUMBER_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        unit: 'em'
    },
    'text-decoration-line': {
        ambiguousKeys: ['text-decoration'],
        ambiguousValues: ['underline', 'overline', 'line-through'],
        type: SyntaxRuleType.Native,
    },
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
    },
    'text-underline-offset': {
        ambiguousKeys: ['text-underline'],
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    },
    'text-underline-position': {
        ambiguousKeys: ['text-underline'],
        ambiguousValues: ['front-font', 'under', 'left', 'right'],
        type: SyntaxRuleType.Native
    },
    'text-overflow': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['ellipsis', 'clip'],
        type: SyntaxRuleType.Native
    },
    'text-orientation': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation'],
        type: SyntaxRuleType.Native
    },
    'text-transform': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['uppercase', 'lowercase', 'capitalize'],
        type: SyntaxRuleType.Native,
    },
    'text-rendering': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision'],
        type: SyntaxRuleType.Native,
    },
    'text-wrap': {
        ambiguousKeys: ['text', 't'],
        ambiguousValues: ['wrap', 'nowrap', 'balance', 'pretty'],
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
        variables: ['spacing']
    },
    bottom: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    left: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    right: {
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    inset: {
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
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
        declare(value) {
            return {
                '-webkit-user-drag': value,
                'user-drag': value,
            } as any
        }
    },
    'user-select': {
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-user-select': value,
                'user-select': value,
            } as any
        }
    },
    'text-shadow': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
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
    },
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
    },
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
    },
    'text-stroke-color': {
        ambiguousKeys: ['text-stroke'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-text-stroke-color': value
            }
        }
    },
    'text-stroke': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-text-stroke': value
            }
        }
    },
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
    },
    'box-shadow': {
        key: 'shadow',
        subkey: 's',
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'table-layout': {
        type: SyntaxRuleType.Native
    },
    'transform-box': {
        ambiguousKeys: ['transform'],
        type: SyntaxRuleType.Native
    },
    'transform-style': {
        ambiguousKeys: ['transform'],
        ambiguousValues: ['flat', 'preserve-3d'],
        type: SyntaxRuleType.Native
    },
    'transform-origin': {
        ambiguousKeys: ['transform'],
        ambiguousValues: ['top', 'bottom', 'right', 'left', 'center', NUMBER_VALUE_REGEX],
        unit: 'px',
        type: SyntaxRuleType.Native
    },
    transform: {
        matcher: /^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\(/,
        type: SyntaxRuleType.Native,
        analyze(className: string) {
            return [className.startsWith('transform') ? className.slice(10) : className]
        },
        unit: 'px',
        variables: ['spacing']
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
        analyze(className: string) {
            if (className.startsWith('@')) {
                return [className.slice(1)]
            } else {
                const indexOfColon = className.indexOf(':')
                this.keyToken = className.slice(0, indexOfColon + 1)
                return [className.slice(indexOfColon + 1)]
            }
        }
    },
    'border-collapse': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: ['collapse', 'separate'],
        type: SyntaxRuleType.Native
    },
    'border-spacing': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    },
    // border color
    'border-top-color': {
        ambiguousKeys: ['bt', 'border-top'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    },
    'border-bottom-color': {
        ambiguousKeys: ['bb', 'border-bottom'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    },
    'border-left-color': {
        ambiguousKeys: ['bl', 'border-left'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    },
    'border-right-color': {
        ambiguousKeys: ['br', 'border-right'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    },
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
    },
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
    },
    'border-color': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.NativeShorthand,
        variables: ['frame'],
    },
    // border radius
    'border-top-left-radius': {
        key: 'rtl',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'border-top-right-radius': {
        key: 'rtr',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'border-bottom-left-radius': {
        key: 'rbl',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'border-bottom-right-radius': {
        key: 'rbr',
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
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
    },
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
    },
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
    },
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
    },
    'border-radius': {
        key: 'r',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand
    },
    // border style
    'border-top-style': {
        ambiguousKeys: ['bt', 'border-top'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    'border-bottom-style': {
        ambiguousKeys: ['bb', 'border-bottom'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    'border-left-style': {
        ambiguousKeys: ['bl', 'border-left'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    'border-right-style': {
        ambiguousKeys: ['br', 'border-right'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native,
    },
    'border-x-style': {
        ambiguousKeys: ['bx', 'border-x'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-left-style': value,
                'border-right-style': value
            } as any
        }
    },
    'border-y-style': {
        ambiguousKeys: ['by', 'border-y'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'border-top-style': value,
                'border-bottom-style': value
            } as any
        }
    },
    'border-style': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.NativeShorthand
    },
    // border width
    'border-top-width': {
        ambiguousKeys: ['bt', 'border-top'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'border-bottom-width': {
        ambiguousKeys: ['bb', 'border-bottom'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'border-left-width': {
        ambiguousKeys: ['bl', 'border-left'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
    'border-right-width': {
        ambiguousKeys: ['br', 'border-right'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
    },
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
    },
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
    },
    'border-width': {
        ambiguousKeys: ['b', 'border'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand
    },
    // border image
    'border-image-repeat': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: ['stretch', 'repeat', 'round', 'space'],
        type: SyntaxRuleType.Native
    },
    'border-image-slice': {
        ambiguousKeys: ['border-image'],
        type: SyntaxRuleType.Native
    },
    'border-image-source': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: [IMAGE_VALUE_REGEX],
        type: SyntaxRuleType.Native
    },
    'border-image-width': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: ['auto', NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'border-image-outset': {
        ambiguousKeys: ['border-image'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
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
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    },
    'border-bottom': {
        key: 'bb',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    },
    'border-left': {
        key: 'bl',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    },
    'border-right': {
        key: 'br',
        type: SyntaxRuleType.NativeShorthand,
        unit: 'rem',
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    },
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
    },
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
    },
    border: {
        key: 'b',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        transformValueComponents: autofillSolidStyle,
        variables: ['frame'],
    },
    'background-attachment': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['fixed', 'local', 'scroll'],
        type: SyntaxRuleType.Native
    },
    'background-blend-mode': {
        key: 'bg-blend',
        type: SyntaxRuleType.Native
    },
    'background-color': {
        ambiguousKeys: ['bg'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
    },
    'background-clip': {
        key: 'bg-clip',
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-background-clip': value,
                'background-clip': value
            }
        }
    },
    'background-origin': {
        key: 'bg-origin',
        type: SyntaxRuleType.Native
    },
    'background-position': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['top', 'bottom', 'right', 'left', 'center'],
        type: SyntaxRuleType.Native,
        unit: 'px'
    },
    'background-repeat': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'],
        type: SyntaxRuleType.Native
    },
    'background-size': {
        ambiguousKeys: ['bg'],
        ambiguousValues: ['auto', 'cover', 'contain', NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
    'background-image': {
        ambiguousKeys: ['bg'],
        ambiguousValues: [IMAGE_VALUE_REGEX],
        type: SyntaxRuleType.Native
    },
    background: {
        key: 'bg',
        type: SyntaxRuleType.NativeShorthand
    },
    gradient: {
        matcher: /^gradient\(/,
        type: SyntaxRuleType.Shorthand,
        declare(value) {
            return {
                'background-image': 'linear-' + value
            }
        }
    },
    'mix-blend-mode': {
        key: 'blend',
        type: SyntaxRuleType.Native
    },
    'backdrop-filter': {
        key: 'bd',
        type: SyntaxRuleType.Native,
        declare(value) {
            return {
                '-webkit-backdrop-filter': value,
                'backdrop-filter': value,
            }
        }
    },
    filter: {
        matcher: /^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/,
        type: SyntaxRuleType.Native,
    },
    fill: {
        type: SyntaxRuleType.Native,
    },
    'stroke-dasharray': {
        type: SyntaxRuleType.Native
    },
    'stroke-dashoffset': {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    },
    'stroke-width': {
        ambiguousKeys: ['stroke'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        type: SyntaxRuleType.Native
    },
    stroke: {
        type: SyntaxRuleType.Native,
    },
    x: {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    },
    y: {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    },
    cx: {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    },
    cy: {
        type: SyntaxRuleType.Native,
        variables: ['spacing']
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
        transformValue(value) {
            return 'span' + ' ' + value + '/' + 'span' + ' ' + value
        },
        declare(value) {
            return {
                'grid-column': value
            }
        },
    },
    'grid-column': {
        key: 'grid-col',
        type: SyntaxRuleType.NativeShorthand,
    },
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
    },
    'grid-row-start': {
        type: SyntaxRuleType.Native
    },
    'grid-row-end': {
        type: SyntaxRuleType.Native
    },
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
    },
    'grid-row': {
        type: SyntaxRuleType.NativeShorthand
    },
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
        variables: ['spacing']
    },
    'row-gap': {
        key: 'gap-y',
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    },
    gap: {
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
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
        ambiguousKeys: ['list-style'],
        ambiguousValues: ['inside', 'outside'],
        type: SyntaxRuleType.Native
    },
    'list-style-type': {
        ambiguousKeys: ['list-style'],
        ambiguousValues: ['disc', 'decimal'],
        type: SyntaxRuleType.Native
    },
    'list-style-image': {
        ambiguousKeys: ['list-style'],
        ambiguousValues: [IMAGE_VALUE_REGEX],
        type: SyntaxRuleType.Native
    },
    'list-style': {
        type: SyntaxRuleType.NativeShorthand
    },
    'outline-color': {
        ambiguousKeys: ['outline'],
        ambiguousValues: [COLOR_VALUE_REGEX],
        type: SyntaxRuleType.Native,
        variables: ['frame'],
    },
    'outline-offset': {
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
    },
    'outline-style': {
        ambiguousKeys: ['outline'],
        ambiguousValues: BORDER_STYLE_VALUES,
        type: SyntaxRuleType.Native
    },
    'outline-width': {
        ambiguousKeys: ['outline'],
        ambiguousValues: ['medium', 'thick', 'thin', NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native
    },
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
    },
    'accent-color': {
        key: 'accent',
        type: SyntaxRuleType.Native,
    },
    appearance: {
        type: SyntaxRuleType.Native
    },
    'caret-color': {
        key: 'caret',
        type: SyntaxRuleType.Native,
        variables: ['text']
    },
    'scroll-behavior': {
        type: SyntaxRuleType.Native
    },
    // scroll margin
    'scroll-margin-left': {
        key: 'scroll-ml',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'scroll-margin-right': {
        key: 'scroll-mr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'scroll-margin-top': {
        key: 'scroll-mt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'scroll-margin-bottom': {
        key: 'scroll-mb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
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
    },
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
    },
    'scroll-margin': {
        key: 'scroll-m',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    },
    // scroll padding
    'scroll-padding-left': {
        key: 'scroll-pl',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'scroll-padding-right': {
        key: 'scroll-pr',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'scroll-padding-top': {
        key: 'scroll-pt',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
    'scroll-padding-bottom': {
        key: 'scroll-pb',
        type: SyntaxRuleType.Native,
        unit: 'rem',
        variables: ['spacing']
    },
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
    },
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
    },
    'scroll-padding': {
        key: 'scroll-p',
        unit: 'rem',
        type: SyntaxRuleType.NativeShorthand,
        variables: ['spacing']
    },
    // scroll snap
    'scroll-snap-align': {
        ambiguousKeys: ['scroll-snap'],
        ambiguousValues: ['start', 'end', 'center'],
        type: SyntaxRuleType.Native
    },
    'scroll-snap-stop': {
        ambiguousKeys: ['scroll-snap'],
        ambiguousValues: ['normal', 'always'],
        type: SyntaxRuleType.Native
    },
    'scroll-snap-type': {
        ambiguousKeys: ['scroll-snap'],
        ambiguousValues: ['x', 'y', 'block', 'inline', 'both'],
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
        ambiguousKeys: ['shape'],
        ambiguousValues: [/(?:inset|circle|ellipse|polygon|url|linear-gradient)\(.*\)/],
        type: SyntaxRuleType.Native
    },
    'shape-margin': {
        ambiguousKeys: ['shape'],
        ambiguousValues: [NUMBER_VALUE_REGEX],
        unit: 'rem',
        type: SyntaxRuleType.Native,
        variables: ['spacing']
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
        declare(value) {
            return {
                '-webkit-mask-image': value,
                'mask-image': value,
            }
        }
    }
} satisfies Record<string, SyntaxRuleDefinition>

export default rules