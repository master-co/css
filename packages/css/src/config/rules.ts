import cssEscape from 'css-shared/utils/css-escape'
import { START_SYMBOLS } from '../constants/start-symbol'
import type { Rule, RuleDefinition } from '../rule'
import { Layer } from '../layer'
import { PropertiesHyphen } from 'csstype'

export const BORDER_STYLES = ['none', 'auto', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']

export const autofillSolidToValueComponent: RuleDefinition['transformValueComponents'] = function (valueComponents) {
    if (valueComponents.length < 2) return valueComponents
    const styleValueComponent = valueComponents.find((valueComponent) => {
        return valueComponent.type === 'string' && BORDER_STYLES.includes(valueComponent.value) ||
            valueComponent.type === 'variable' && BORDER_STYLES.includes(valueComponent.variable?.value)
    })
    if (!styleValueComponent) {
        valueComponents.push(
            { type: 'separator', value: ' ' },
            { type: 'string', value: 'solid' }
        )
    }
    return valueComponents
}

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
                    } else if (char in START_SYMBOLS && (end !== '\'' && end !== '"')) {
                        i++
                        analyze(START_SYMBOLS[char as keyof typeof START_SYMBOLS])
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
                ['--' + this.prefix.slice(1, -1)]: value
            }
        }
    } as RuleDefinition,
    'font-size': {
        match: ['f(?:ont)?'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'font-weight': {
        match: ['f(?:ont)?', ['bolder']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'font-family': {
        match: ['f(?:ont)?'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'font-smoothing': {
        match: ['f(?:ont)?', ['antialiased', 'subpixel-antialiased']],
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
        match: ['f(?:ont)?', ['normal', 'italic', 'oblique']],
        layer: Layer.CoreNative,
        unit: 'deg'
    } as RuleDefinition,
    'font-variant-numeric': {
        match: ['f(?:ont)?', ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'font-variant': {
        layer: Layer.CoreNativeShorthand
    },
    'font-feature-settings': {
        match: /^font-feature:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    font: {
        match: /^f:/,
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
    color: {
        match: /^(?:color|fg):/,
        layer: Layer.CoreNative,
        colored: true,
        variables: ['text']
    } as RuleDefinition,
    // margin
    'margin-left': {
        match: /^ml:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-right': {
        match: /^mr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-top': {
        match: /^mt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-bottom': {
        match: /^mb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-x': {
        match: /^(?:mx|margin-x):/,
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
        match: /^(?:my|margin-y):/,
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
        match: /^m:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // margin inline
    'margin-inline-start': {
        match: /^mis:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-inline-end': {
        match: /^mie:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'margin-inline': {
        match: /^mi:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // padding
    'padding-left': {
        match: /^pl:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-right': {
        match: /^pr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-top': {
        match: /^pt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-bottom': {
        match: /^pb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-x': {
        match: /^(?:px|padding-x):/,
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
        match: /^(?:py|padding-y):/,
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
        match: /^p:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // padding inline
    'padding-inline-start': {
        match: /^pis:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-inline-end': {
        match: /^pie:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'padding-inline': {
        match: /^pi:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // flex
    'flex-basis': {
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'flex-wrap': {
        match: ['flex', ['wrap', 'nowrap', 'wrap-reverse']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'flex-grow': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'flex-shrink': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'flex-direction': {
        match: ['flex', ['row', 'row-reverse', 'column', 'column-reverse']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    flex: {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    display: {
        match: /^d:/,
        layer: Layer.CoreNative,
    } as RuleDefinition,
    width: {
        match: /^w:/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    height: {
        match: /^h:/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'min-width': {
        match: /^min-w:/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'min-height': {
        match: /^min-h:/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    size: {
        match: /^size:/,
        layer: Layer.CoreShorthand,
        unit: 'rem',
        declare(value, valueComponents) {
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
        match: /^min:/,
        layer: Layer.CoreShorthand,
        unit: 'rem',
        declare(value, valueComponents) {
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
        match: /^max:/,
        layer: Layer.CoreShorthand,
        unit: 'rem',
        declare(value, valueComponents) {
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
        match: /^box:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'box-decoration-break': {
        match: ['box-decoration', ['slice', 'clone']],
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
    'letter-spacing': {
        match: /^ls:/,
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleDefinition,
    'line-height': {
        match: /^lh:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'object-fit': {
        match: ['(?:object|obj)', ['contain', 'cover', 'fill', 'scale-down']],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'object-position': {
        match: ['(?:object|obj)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-align': {
        match: ['t(?:ext)?', ['justify', 'center', 'left', 'right', 'start', 'end']],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-decoration-color': {
        match: ['text-decoration'],
        layer: Layer.CoreNative,
        colored: true,
        variables: ['text']
    } as RuleDefinition,
    'text-decoration-style': {
        match: ['t(?:ext)?', ['solid', 'double', 'dotted', 'dashed', 'wavy']],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-decoration-thickness': {
        match: ['text-decoration', ['from-font']],
        numeric: true,
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleDefinition,
    'text-decoration-line': {
        match: ['t(?:ext)?', ['none', 'underline', 'overline', 'line-through']],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-decoration': {
        match: ['t(?:ext)?', ['underline', 'overline', 'line-through']],
        unit: 'rem',
        colored: true,
        layer: Layer.CoreNativeShorthand,
        variables: ['text']
    } as RuleDefinition,
    'text-underline-offset': {
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    'text-overflow': {
        match: ['t(?:ext)?', ['ellipsis', 'clip']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'text-orientation': {
        match: ['t(?:ext)?', ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'text-transform': {
        match: ['t(?:ext)?', ['uppercase', 'lowercase', 'capitalize']],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-rendering': {
        match: ['t(?:ext)?', ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision']],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'text-indent': {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'vertical-align': {
        match: /^(?:v|vertical):/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    columns: {
        match: /^(?:columns|cols):/,
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
    lines: {
        match: /^lines:/,
        declare(value) {
            return {
                overflow: 'hidden',
                display: '-webkit-box',
                'overflow-wrap': 'break-word',
                'text-overflow': 'ellipsis',
                '-webkit-box-orient': 'vertical',
                '-webkit-line-clamp': value
            }
        }
    } as RuleDefinition,
    'max-height': {
        match: /^max-h:/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'max-width': {
        match: /^max-w:/,
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
        match: /^z:/,
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
        match: ['t(?:ext)?'],
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
        match: ['(?:text-fill|text|t)'],
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
        match: ['text-stroke', ['thin', 'medium', 'thick']],
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
        match: ['text-stroke'],
        layer: Layer.CoreNative,
        colored: true,
        variables: ['text'],
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
        match: /^s(?:hadow)?:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'table-layout': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transform-box': {
        match: ['transform'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transform-style': {
        match: ['transform', ['flat', 'preserve-3d']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transform-origin': {
        match: ['transform', ['top', 'bottom', 'right', 'left', 'center']],
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
        match: /^~property:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transition-timing-function': {
        match: /^~easing:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'transition-duration': {
        match: /^~duration:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleDefinition,
    'transition-delay': {
        match: /^~delay:/,
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
                this.prefix = className.slice(0, indexOfColon + 1)
                return [className.slice(indexOfColon + 1)]
            }
        },
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'animation-delay': {
        match: /^@delay:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleDefinition,
    'animation-direction': {
        match: /^@direction:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-duration': {
        match: /^@duration:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleDefinition,
    'animation-fill-mode': {
        match: /^@fill:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-iteration-count': {
        match: /^@iteration:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-name': {
        match: /^@name:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-play-state': {
        match: /^@play:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'animation-timing-function': {
        match: /^@easing:/,
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
                this.prefix = className.slice(0, indexOfColon + 1)
                return [className.slice(indexOfColon + 1)]
            }
        }
    } as RuleDefinition,
    'border-collapse': {
        match: ['b(?:order)?', ['collapse', 'separate']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-spacing': {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    // border color
    'border-top-color': {
        match: ['b(?:t|order-top(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'border-bottom-color': {
        match: ['b(?:b|order-bottom(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'border-left-color': {
        match: ['b(?:l|order-left(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'border-right-color': {
        match: ['b(?:r|order-right(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'border-x-color': {
        match: ['b(?:x|order-x(?:-color)?)'],
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
        match: ['b(?:y|order-y(?:-color)?)'],
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
        match: ['b(?:order)?(?:-color)?'],
        layer: Layer.CoreNativeShorthand,
        colored: true
    } as RuleDefinition,
    // border radius
    'border-top-left-radius': {
        match: /^r(?:tl|lt):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-top-right-radius': {
        match: /^r(?:tr|rt):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-bottom-left-radius': {
        match: /^r(?:bl|lb):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-bottom-right-radius': {
        match: /^r(?:br|rb):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-top-radius': {
        match: /^rt:/,
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
        match: /^rb:/,
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
        match: /^rl:/,
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
        match: /^rr:/,
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
        match: /^r:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    // border style
    'border-top-style': {
        match: ['b(?:t|order-top(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-bottom-style': {
        match: ['b(?:b|order-bottom(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-left-style': {
        match: ['b(?:l|order-left(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-right-style': {
        match: ['b(?:r|order-right(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-x-style': {
        match: ['b(?:x|order-x(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-left-style': value,
                'border-right-style': value
            }
        }
    } as RuleDefinition,
    'border-y-style': {
        match: ['b(?:y|order-y(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-top-style': value,
                'border-bottom-style': value
            }
        }
    } as RuleDefinition,
    'border-style': {
        match: ['b(?:order)?(?:-style)?', BORDER_STYLES],
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    // border width
    'border-top-width': {
        match: ['b(?:t|order-top(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-bottom-width': {
        match: ['b(?:b|order-bottom(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-left-width': {
        match: ['b(?:l|order-left(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-right-width': {
        match: ['b(?:r|order-right(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleDefinition,
    'border-x-width': {
        match: ['b(?:x|order-x(?:-width)?)'],
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
        match: ['b(?:y|order-y(?:-width)?)'],
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
        match: ['b(?:order)?(?:-width)?'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    // border image
    'border-image-outset': {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image-repeat': {
        match: ['border-image', ['stretch', 'repeat', 'round', 'space']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image-slice': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image-source': {
        match: ['border-image', ['url', 'linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image-width': {
        match: ['border-image', ['auto']],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'border-image': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    // border
    'border-top': {
        match: /^bt:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-bottom': {
        match: /^bb:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-left': {
        match: /^bl:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-right': {
        match: /^br:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'border-x': {
        match: /^(?:bx|border-x):/,
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
        match: /^(?:by|border-y):/,
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
        match: /^b:/,
        unit: 'rem',
        colored: true,
        layer: Layer.CoreNativeShorthand,
        transformValueComponents: autofillSolidToValueComponent,
    } as RuleDefinition,
    'background-attachment': {
        match: ['(?:bg|background)', ['fixed', 'local', 'scroll']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-blend-mode': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-color': {
        match: ['(?:bg|background)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'background-clip': {
        match: ['(?:bg|background)', ['text']],
        layer: Layer.CoreNative,
        declare(value) {
            return {
                '-webkit-background-clip': value,
                'background-clip': value
            }
        }
    } as RuleDefinition,
    'background-origin': {
        match: ['(?:bg|background)'],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-position': {
        match: ['(?:bg|background)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: Layer.CoreNative,
        unit: 'px'
    } as RuleDefinition,
    'background-repeat': {
        match: ['(?:bg|background)', ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-size': {
        match: ['(?:bg|background)', ['auto', 'cover', 'contain']],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleDefinition,
    'background-image': {
        match: ['(?:bg|background)', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    background: {
        match: /^bg:/,
        colored: true,
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    gradient: {
        match: /^gradient\(/,
        layer: Layer.CoreNative,
        colored: true,
        declare(value) {
            return {
                'background-image': 'linear-' + value
            }
        }
    } as RuleDefinition,
    'mix-blend-mode': {
        match: /^blend:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'backdrop-filter': {
        match: /^bd:/,
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
        match: /^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    fill: {
        match: /^fill:/,
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
        match: ['stroke(?:-width)?'],
        numeric: true,
        layer: Layer.CoreNative
    } as RuleDefinition,
    stroke: {
        match: ['stroke'],
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
        match: /^grid-col(?:umn)?-start:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-column-end': {
        match: /^grid-col(?:umn)?-end:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-column': {
        match: /^grid-col(?:umn)?(?:-span)?:/,
        layer: Layer.CoreNativeShorthand,
        transformValue(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleDefinition,
    'grid-columns': {
        match: /^grid-col(?:umn)?s:/,
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
    'grid-row': {
        match: /^grid-row-span:/,
        layer: Layer.CoreNativeShorthand,
        transformValue(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleDefinition,
    'grid-rows': {
        match: /^grid-rows:/,
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
        match: /^grid-auto-cols:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-auto-flow': {
        match: /^grid-flow:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-auto-rows': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-template-areas': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'grid-template-columns': {
        match: /^grid-template-cols:/,
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
        match: /^gap-x:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    'row-gap': {
        match: /^gap-y:/,
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
        match: /^o:/,
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
        match: /^aspect:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'column-span': {
        match: /^col-span:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'align-content': {
        match: /^ac:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'align-items': {
        match: /^ai:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'align-self': {
        match: /^as:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'justify-content': {
        match: /^jc:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'justify-items': {
        match: /^ji:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    'justify-self': {
        match: /^js:/,
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
        match: ['list-style', ['inside', 'outside']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'list-style-type': {
        match: ['list-style', ['disc', 'decimal']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'list-style-image': {
        match: ['list-style', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'list-style': {
        layer: Layer.CoreNativeShorthand
    } as RuleDefinition,
    'outline-color': {
        match: ['outline'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    'outline-offset': {
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    'outline-style': {
        match: ['outline', BORDER_STYLES],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'outline-width': {
        match: ['outline', ['medium', 'thick', 'thin']],
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
        match: /^accent:/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleDefinition,
    appearance: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'caret-color': {
        match: /^caret:/,
        layer: Layer.CoreNative,
        colored: true,
        variables: ['text']
    } as RuleDefinition,
    'scroll-behavior': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    // scroll margin
    'scroll-margin-left': {
        match: /^scroll-ml:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-right': {
        match: /^scroll-mr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-top': {
        match: /^scroll-mt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-bottom': {
        match: /^scroll-mb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-margin-x': {
        match: /^(?:scroll-margin-x|scroll-mx):/,
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
        match: /^(?:scroll-margin-y|scroll-my):/,
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
        match: /^scroll-m:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // scroll padding
    'scroll-padding-left': {
        match: /^scroll-pl:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-right': {
        match: /^scroll-pr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-top': {
        match: /^scroll-pt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-bottom': {
        match: /^scroll-pb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variables: ['spacing']
    } as RuleDefinition,
    'scroll-padding-x': {
        match: /^(?:scroll-padding-x|scroll-px):/,
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
        match: /^(?:scroll-padding-y|scroll-py):/,
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
        match: /^scroll-p:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variables: ['spacing']
    } as RuleDefinition,
    // scroll snap
    'scroll-snap-align': {
        match: ['scroll-snap', ['start', 'end', 'center']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'scroll-snap-stop': {
        match: ['scroll-snap', ['normal', 'always']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'scroll-snap-type': {
        match: ['scroll-snap', ['x', 'y', 'block', 'inline', 'both']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'will-change': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'writing-mode': {
        match: /^writing:/,
        layer: Layer.CoreNative
    } as RuleDefinition,
    direction: {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'shape-outside': {
        match: ['shape', ['(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleDefinition,
    'shape-margin': {
        match: ['shape'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
        variables: ['spacing']
    } as RuleDefinition,
    'shape-image-threshold': {
        layer: Layer.CoreNative
    } as RuleDefinition,
    'clip-path': {
        match: /^clip:/,
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