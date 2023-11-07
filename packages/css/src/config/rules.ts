import cssEscape from 'css-shared/utils/css-escape'
import { START_SYMBOLS } from '../constants/start-symbol'
import type { Rule, RuleOptions } from '../rule'
import { CSSDeclarations } from '../types/css-declarations'
import { Layer } from '../layer'

export const BORDER_STYLES = ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']

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
            const declarations: CSSDeclarations = {}

            const addProp = (propertyName: string) => {
                const indexOfColon = propertyName.indexOf(':')
                if (indexOfColon !== -1) {
                    declarations[propertyName.slice(0, indexOfColon)] = propertyName.slice(indexOfColon + 1)
                }
            }
            const handleRule = (rule: Rule) => {
                const addProps = (cssText: string) => {
                    const cssProperties = cssText.slice(cssEscape(rule.className).length).match(/\{(.*)\}/)[1].split(';')
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

            const names = []
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
                        analyze(START_SYMBOLS[char])
                    }
                }
            })(undefined)
            addName()

            for (const eachName of names) {
                const rules = this.css.create(eachName)
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
    } as RuleOptions,
    variable: {
        match: /^\$[\w-]+:/, // don't use 'rem' as default, because css variable is common API
        colored: true,
        layer: Layer.Core,
        declare(value) {
            return {
                ['--' + this.prefix.slice(1, -1)]: value
            }
        }
    } as RuleOptions,
    'font-size': {
        match: ['f(?:ont)?'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    'font-weight': {
        match: ['f(?:ont)?', ['bolder']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'font-family': {
        match: ['f(?:ont)?'],
        layer: Layer.CoreNative
    } as RuleOptions,
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
    } as RuleOptions,
    'font-style': {
        match: ['f(?:ont)?', ['normal', 'italic', 'oblique']],
        layer: Layer.CoreNative,
        unit: 'deg'
    } as RuleOptions,
    'font-variant-numeric': {
        match: ['f(?:ont)?', ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'font-variant': {
        layer: Layer.CoreNativeShorthand
    },
    'font-feature-settings': {
        match: /^font-feature:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    font: {
        match: /^f:/,
        layer: Layer.CoreNativeShorthand,
        variableGroups: [
            'font-family',
            'font-variant',
            'font-weight',
            'font-size',
            'font-style',
            'line-height'
        ]
    } as RuleOptions,
    color: {
        match: /^(?:color|fg|foreground):/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    // margin
    'margin-left': {
        match: /^ml:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'margin-right': {
        match: /^mr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'margin-top': {
        match: /^mt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'margin-bottom': {
        match: /^mb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'margin-x': {
        match: /^(?:mx|margin-x):/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'margin-left': value + unit,
                'margin-right': value + unit
            }
        },
        variableGroups: ['spacing']
    } as RuleOptions,
    'margin-y': {
        match: /^(?:my|margin-y):/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'margin-top': value + unit,
                'margin-bottom': value + unit
            }
        },
        variableGroups: ['spacing']
    } as RuleOptions,
    margin: {
        match: /^m:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // margin inline
    'margin-inline-start': {
        match: /^mis:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'margin-inline-end': {
        match: /^mie:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'margin-inline': {
        match: /^mi:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // padding
    'padding-left': {
        match: /^pl:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'padding-right': {
        match: /^pr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'padding-top': {
        match: /^pt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'padding-bottom': {
        match: /^pb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'padding-x': {
        match: /^(?:px|padding-x):/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'padding-left': value + unit,
                'padding-right': value + unit
            }
        },
        variableGroups: ['spacing']
    } as RuleOptions,
    'padding-y': {
        match: /^(?:py|padding-y):/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'padding-top': value + unit,
                'padding-bottom': value + unit
            }
        },
        variableGroups: ['spacing']
    } as RuleOptions,
    padding: {
        match: /^p:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // padding inline
    'padding-inline-start': {
        match: /^pis:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'padding-inline-end': {
        match: /^pie:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'padding-inline': {
        match: /^pi:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // flex
    'flex-basis': {
        variableGroups: ['sizing'],
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    'flex-wrap': {
        match: ['flex', ['wrap', 'nowrap', 'wrap-reverse']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'flex-grow': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'flex-shrink': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'flex-direction': {
        match: ['flex', ['row', 'row-reverse', 'column', 'column-reverse']],
        layer: Layer.CoreNative
    } as RuleOptions,
    flex: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    display: {
        match: /^d:/,
        layer: Layer.CoreNative,
    } as RuleOptions,
    width: {
        match: /^w:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    height: {
        match: /^h:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    'min-width': {
        match: /^min-w:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    'min-height': {
        match: /^min-h:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    box: {
        match: /^(?:(?:max|min|clamp|calc)\(.+\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\(.+\)|[0-9]+[a-z]*?)/,
        layer: Layer.CoreShorthand,
        unit: 'rem',
        separators: ['x'],
        analyze(className: string) {
            return [className]
        },
        declare(value) {
            const [width, height] = value.split(' x ')
            return {
                width,
                height
            }
        }
    } as RuleOptions,
    'min-box': {
        match: /^min:/,
        layer: Layer.CoreShorthand,
        unit: 'rem',
        separators: ['x'],
        analyze(className: string) {
            return [className.slice(4)]
        },
        declare(value) {
            const [width, height] = value.split(' x ')
            return {
                'min-width': width,
                'min-height': height
            }
        }
    } as RuleOptions,
    'max-box': {
        match: /^max:/,
        layer: Layer.CoreShorthand,
        unit: 'rem',
        separators: ['x'],
        analyze(className: string) {
            return [className.slice(4)]
        },
        declare(value) {
            const [width, height] = value.split(' x ')
            return {
                'max-width': width,
                'max-height': height
            }
        }
    } as RuleOptions,
    'box-sizing': {
        match: /^box:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'box-decoration-break': {
        match: ['sizing', ['slice', 'clone']],
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'box-decoration-break': value + unit,
                '-webkit-box-decoration-break': value + unit
            }
        }
    } as RuleOptions,
    contain: {
        layer: Layer.CoreNative
    } as RuleOptions,
    content: {
        layer: Layer.CoreNative
    } as RuleOptions,
    'counter-increment': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'counter-reset': {
        layer: Layer.CoreNative,
    } as RuleOptions,
    'letter-spacing': {
        match: /^ls:/,
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleOptions,
    'line-height': {
        match: /^lh:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'object-fit': {
        match: ['(?:object|obj)', ['contain', 'cover', 'fill', 'scale-down']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'object-position': {
        match: ['(?:object|obj)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'text-align': {
        match: ['t(?:ext)?', ['justify', 'center', 'left', 'right', 'start', 'end']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'text-decoration-color': {
        match: ['text-decoration'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'text-decoration-style': {
        match: ['t(?:ext)?', ['solid', 'double', 'dotted', 'dashed', 'wavy']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'text-decoration-thickness': {
        match: ['text-decoration', ['from-font']],
        numeric: true,
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleOptions,
    'text-decoration-line': {
        match: ['t(?:ext)?', ['none', 'underline', 'overline', 'line-through']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'text-decoration': {
        match: ['t(?:ext)?', ['underline', 'overline', 'line-through']],
        unit: 'rem',
        colored: true,
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'text-underline-offset': {
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    'text-overflow': {
        match: ['t(?:ext)?', ['ellipsis', 'clip']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'text-orientation': {
        match: ['t(?:ext)?', ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'text-transform': {
        match: ['t(?:ext)?', ['uppercase', 'lowercase', 'capitalize']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'text-rendering': {
        match: ['t(?:ext)?', ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'text-indent': {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    'vertical-align': {
        match: /^(?:v|vertical):/,
        layer: Layer.CoreNative
    } as RuleOptions,
    columns: {
        match: /^(?:columns|cols):/,
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'white-space': {
        layer: Layer.CoreNative
    } as RuleOptions,
    top: {
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    bottom: {
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    left: {
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    right: {
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    inset: {
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    lines: {
        match: /^lines:/,
        declare(value, unit) {
            return {
                overflow: 'hidden',
                display: '-webkit-box',
                'overflow-wrap': 'break-word',
                'text-overflow': 'ellipsis',
                '-webkit-box-orient': 'vertical',
                '-webkit-line-clamp': value + unit
            }
        }
    } as RuleOptions,
    'max-height': {
        match: /^max-h:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    'max-width': {
        match: /^max-w:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    opacity: {
        layer: Layer.CoreNative,
    } as RuleOptions,
    visibility: {
        layer: Layer.CoreNative
    } as RuleOptions,
    clear: {
        layer: Layer.CoreNative,
    } as RuleOptions,
    float: {
        layer: Layer.CoreNative
    } as RuleOptions,
    isolation: {
        layer: Layer.CoreNative
    } as RuleOptions,
    'overflow-x': {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-x': ['auto', value] }
                : { 'overflow-x': value }
        }
    } as RuleOptions,
    'overflow-y': {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-y': ['auto', value] }
                : { 'overflow-y': value }
        }
    } as RuleOptions,
    overflow: {
        layer: Layer.CoreNativeShorthand,
        declare(value, unit) {
            return value === 'overlay'
                ? { overflow: ['auto', value] }
                : { overflow: value }
        }
    } as RuleOptions,
    'overscroll-behavior-x': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'overscroll-behavior-y': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'overscroll-behavior': {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'z-index': {
        match: /^z:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    position: {
        layer: Layer.CoreNative
    } as RuleOptions,
    cursor: {
        layer: Layer.CoreNative
    } as RuleOptions,
    'pointer-events': {
        layer: Layer.CoreNative
    } as RuleOptions,
    resize: {
        layer: Layer.CoreNative
    } as RuleOptions,
    'touch-action': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'word-break': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'word-spacing': {
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleOptions,
    'user-drag': {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'user-drag': value + unit,
                '-webkit-user-drag': value + unit
            }
        }
    } as RuleOptions,
    'user-select': {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'user-select': value + unit,
                '-webkit-user-select': value + unit
            }
        }
    } as RuleOptions,
    'text-shadow': {
        unit: 'rem',
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'text-size': {
        match: ['t(?:ext)?'],
        numeric: true,
        unit: 'rem',
        declare(value, unit) {
            const diff = .875
            return {
                'font-size': value + unit,
                'line-height': unit === 'em'
                    ? value + diff + unit
                    : `calc(${value}${unit} + ${diff}em)`
            }
        }
    } as RuleOptions,
    'text-fill-color': {
        match: ['(?:text-fill|text|t)'],
        layer: Layer.CoreNative,
        colored: true,
        declare(value, unit) {
            return {
                '-webkit-text-fill-color': value + unit
            }
        }
    } as RuleOptions,
    'text-stroke-width': {
        match: ['text-stroke', ['thin', 'medium', 'thick']],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                '-webkit-text-stroke-width': value + unit
            }
        },
    } as RuleOptions,
    'text-stroke-color': {
        match: ['text-stroke'],
        layer: Layer.CoreNative,
        colored: true,
        declare(value, unit) {
            return {
                '-webkit-text-stroke-color': value + unit
            }
        }
    } as RuleOptions,
    'text-stroke': {
        unit: 'rem',
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                '-webkit-text-stroke': value + unit
            }
        }
    } as RuleOptions,
    'box-shadow': {
        match: /^s(?:hadow)?:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'table-layout': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'transform-box': {
        match: ['transform'],
        layer: Layer.CoreNative
    } as RuleOptions,
    'transform-style': {
        match: ['transform', ['flat', 'preserve-3d']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'transform-origin': {
        match: ['transform', ['top', 'bottom', 'right', 'left', 'center']],
        numeric: true,
        unit: 'px',
        layer: Layer.CoreNative
    } as RuleOptions,
    transform: {
        match: /^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\(/,
        layer: Layer.CoreNative,
        analyze(className: string) {
            return [className.startsWith('transform') ? className.slice(10) : className]
        },
        variableGroups: ['spacing']
    } as RuleOptions,
    'transition-property': {
        match: /^~property:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'transitionTiming-function': {
        match: /^~easing:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'transition-duration': {
        match: /^~duration:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleOptions,
    'transition-delay': {
        match: /^~delay:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleOptions,
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
    } as RuleOptions,
    'animation-delay': {
        match: /^@delay:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleOptions,
    'animation-direction': {
        match: /^@direction:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'animation-duration': {
        match: /^@duration:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleOptions,
    'animation-fill-mode': {
        match: /^@fill:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'animation-iteration-count': {
        match: /^@iteration:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'animation-name': {
        match: /^@name:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'animation-play-state': {
        match: /^@play:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'animation-timing-function': {
        match: /^@easing:/,
        layer: Layer.CoreNative
    } as RuleOptions,
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
    } as RuleOptions,
    'border-collapse': {
        match: ['b(?:order)?', ['collapse', 'separate']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-spacing': {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    // border color
    'border-top-color': {
        match: ['b(?:t|order-top(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'border-bottom-color': {
        match: ['b(?:b|order-bottom(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'border-left-color': {
        match: ['b(?:l|order-left(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'border-right-color': {
        match: ['b(?:r|order-right(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'border-x-color': {
        match: ['b(?:x|order-x(?:-color)?)'],
        layer: Layer.CoreShorthand,
        colored: true,
        declare(value, unit) {
            return {
                'border-left-color': value + unit,
                'border-right-color': value + unit
            }
        }
    } as RuleOptions,
    'border-y-color': {
        match: ['b(?:y|order-y(?:-color)?)'],
        layer: Layer.CoreShorthand,
        colored: true,
        declare(value, unit) {
            return {
                'border-top-color': value + unit,
                'border-bottom-color': value + unit
            }
        }
    } as RuleOptions,
    'border-color': {
        match: ['b(?:order)?(?:-color)?'],
        layer: Layer.CoreNativeShorthand,
        colored: true
    } as RuleOptions,
    // border radius
    'border-top-left-radius': {
        match: /^r(?:tl|lt):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-top-right-radius': {
        match: /^r(?:tr|rt):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-bottom-left-radius': {
        match: /^r(?:bl|lb):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-bottom-right-radius': {
        match: /^r(?:br|rb):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-top-radius': {
        match: /^rt:/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-top-left-radius': value + unit,
                'border-top-right-radius': value + unit
            }
        }
    } as RuleOptions,
    'border-bottom-radius': {
        match: /^rb:/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-bottom-left-radius': value + unit,
                'border-bottom-right-radius': value + unit
            }
        }
    } as RuleOptions,
    'border-left-radius': {
        match: /^rl:/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-top-left-radius': value + unit,
                'border-bottom-left-radius': value + unit
            }
        }
    } as RuleOptions,
    'border-right-radius': {
        match: /^rr:/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-top-right-radius': value + unit,
                'border-bottom-right-radius': value + unit
            }
        }
    } as RuleOptions,
    'border-radius': {
        match: /^r:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    // border style
    'border-top-style': {
        match: ['b(?:t|order-top(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'border-bottom-style': {
        match: ['b(?:b|order-bottom(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'border-left-style': {
        match: ['b(?:l|order-left(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'border-right-style': {
        match: ['b(?:r|order-right(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleOptions,
    'border-x-style': {
        match: ['b(?:x|order-x(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-left-style': value + unit,
                'border-right-style': value + unit
            }
        }
    } as RuleOptions,
    'border-y-style': {
        match: ['b(?:y|order-y(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-top-style': value + unit,
                'border-bottom-style': value + unit
            }
        }
    } as RuleOptions,
    'border-style': {
        match: ['b(?:order)?(?:-style)?', BORDER_STYLES],
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    // border width
    'border-top-width': {
        match: ['b(?:t|order-top(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    'border-bottom-width': {
        match: ['b(?:b|order-bottom(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    'border-left-width': {
        match: ['b(?:l|order-left(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    'border-right-width': {
        match: ['b(?:r|order-right(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    'border-x-width': {
        match: ['b(?:x|order-x(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-left-width': value + unit,
                'border-right-width': value + unit
            }
        }
    } as RuleOptions,
    'border-y-width': {
        match: ['b(?:y|order-y(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-top-width': value + unit,
                'border-bottom-width': value + unit
            }
        }
    } as RuleOptions,
    'border-width': {
        match: ['b(?:order)?(?:-width)?'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    // border image
    'border-image-outset': {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-image-repeat': {
        match: ['border-image', ['stretch', 'repeat', 'round', 'space']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-image-slice': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-image-source': {
        match: ['border-image', ['url', 'linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-image-width': {
        match: ['border-image', ['auto']],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    'border-image': {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    // border
    'border-top': {
        match: /^bt:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true
    } as RuleOptions,
    'border-bottom': {
        match: /^bb:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true
    } as RuleOptions,
    'border-left': {
        match: /^bl:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true
    } as RuleOptions,
    'border-right': {
        match: /^br:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true
    } as RuleOptions,
    'border-x': {
        match: /^(?:bx|border-x):/,
        unit: 'rem',
        colored: true,
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-left': value,
                'border-right': value
            }
        }
    } as RuleOptions,
    'border-y': {
        match: /^(?:by|border-y):/,
        unit: 'rem',
        colored: true,
        layer: Layer.CoreShorthand,
        declare(value) {
            return {
                'border-top': value,
                'border-bottom': value
            }
        }
    } as RuleOptions,
    border: {
        match: /^b:/,
        unit: 'rem',
        colored: true,
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'background-attachment': {
        match: ['(?:bg|background)', ['fixed', 'local', 'scroll']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'background-blend-mode': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'background-color': {
        match: ['(?:bg|background)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'background-clip': {
        match: ['(?:bg|background)', ['text']],
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                '-webkit-background-clip': value + unit,
                'background-clip': value + unit
            }
        }
    } as RuleOptions,
    'background-origin': {
        match: ['(?:bg|background)'],
        layer: Layer.CoreNative
    } as RuleOptions,
    'background-position': {
        match: ['(?:bg|background)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: Layer.CoreNative,
        unit: 'px'
    } as RuleOptions,
    'background-repeat': {
        match: ['(?:bg|background)', ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'background-size': {
        match: ['(?:bg|background)', ['auto', 'cover', 'contain']],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    'background-image': {
        match: ['(?:bg|background)', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleOptions,
    background: {
        match: /^bg:/,
        colored: true,
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    gradient: {
        match: /^gradient\(/,
        layer: Layer.CoreNative,
        colored: true,
        declare(value) {
            return {
                'background-image': 'linear-' + value
            }
        }
    } as RuleOptions,
    'mixBlend-mode': {
        match: /^blend:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'backdrop-filter': {
        match: /^bd:/,
        layer: Layer.CoreNative,
        colored: true,
        declare(value, unit) {
            return {
                'backdrop-filter': value + unit,
                '-webkit-backdrop-filter': value + unit
            }
        }
    } as RuleOptions,
    filter: {
        match: /^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    fill: {
        match: /^fill:/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'stroke-dasharray': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'stroke-dashoffset': {
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    'stroke-width': {
        match: ['stroke(?:-width)?'],
        numeric: true,
        layer: Layer.CoreNative
    } as RuleOptions,
    stroke: {
        match: ['stroke'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    x: {
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    y: {
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    cx: {
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    cy: {
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    rx: {
        layer: Layer.CoreNative
    } as RuleOptions,
    ry: {
        layer: Layer.CoreNative
    } as RuleOptions,
    'grid-column-start': {
        match: /^grid-col-start:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'grid-column-end': {
        match: /^grid-col-end:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'grid-column': {
        match: /^grid-col(?:umn)?(?:-span)?:/,
        layer: Layer.CoreNativeShorthand,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleOptions,
    'grid-columns': {
        match: /^grid-cols:/,
        declare(value, unit) {
            return {
                display: 'grid',
                'grid-template-columns': 'repeat'
                    + '(' + value + unit
                    + ','
                    + 'minmax'
                    + '(' + 0 + ',' + 1 + 'fr' + '))',
            }
        },
        layer: Layer.Core
    } as RuleOptions,
    'grid-row-start': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'grid-row-end': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'grid-row': {
        match: /^grid-row-span:/,
        layer: Layer.CoreNativeShorthand,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleOptions,
    'grid-rows': {
        match: /^grid-rows:/,
        declare(value, unit) {
            return {
                display: 'grid',
                'grid-auto-flow': 'column',
                'grid-template-rows': 'repeat'
                    + '(' + value + unit
                    + ','
                    + 'minmax'
                    + '(' + 0 + ',' + 1 + 'fr' + '))',
            }
        },
        layer: Layer.Core
    } as RuleOptions,
    'grid-auto-columns': {
        match: /^grid-auto-cols:/,
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    'grid-auto-flow': {
        match: /^grid-flow:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'grid-auto-rows': {
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    'grid-template-areas': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'grid-template-columns': {
        match: /^grid-template-cols:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['sizing']
    } as RuleOptions,
    'grid-template-rows': {
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['sizing']
    } as RuleOptions,
    'grid-template': {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'grid-area': {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    grid: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'column-gap': {
        match: /^gap-x:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    'row-gap': {
        match: /^gap-y:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    gap: {
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    order: {
        match: /^o:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'break-inside': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'break-before': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'break-after': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'aspect-ratio': {
        match: /^aspect:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'column-span': {
        match: /^col-span:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'align-content': {
        match: /^ac:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'align-items': {
        match: /^ai:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'align-self': {
        match: /^as:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'justify-content': {
        match: /^jc:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'justify-items': {
        match: /^ji:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'justify-self': {
        match: /^js:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    'place-content': {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'place-items': {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'place-self': {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'list-style-position': {
        match: ['list-style', ['inside', 'outside']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'list-style-type': {
        match: ['list-style', ['disc', 'decimal']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'list-style-image': {
        match: ['list-style', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'list-style': {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    'outline-color': {
        match: ['outline'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'outline-offset': {
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    'outline-style': {
        match: ['outline', ['dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'outline-width': {
        match: ['outline', ['medium', 'thick', 'thin']],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    outline: {
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        colored: true,
        variableGroups: [
            'outlineWidth',
            'outlineStyle',
            'outlineOffset',
            'outlineColor'
        ]
    } as RuleOptions,
    'accent-color': {
        match: /^accent:/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    appearance: {
        layer: Layer.CoreNative
    } as RuleOptions,
    'caret-color': {
        match: /^caret:/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    'scroll-behavior': {
        layer: Layer.CoreNative
    } as RuleOptions,
    // scroll margin
    'scroll-margin-left': {
        match: /^scroll-ml:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-margin-right': {
        match: /^scroll-mr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-margin-top': {
        match: /^scroll-mt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-margin-bottom': {
        match: /^scroll-mb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-margin-x': {
        match: /^(?:scroll-margin-x|scroll-mx):/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'scroll-margin-left': value + unit,
                'scroll-margin-right': value + unit
            }
        },
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-margin-y': {
        match: /^(?:scroll-margin-y|scroll-my):/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'scroll-margin-top': value + unit,
                'scroll-margin-bottom': value + unit
            }
        },
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-margin': {
        match: /^scroll-m:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // scroll padding
    'scroll-padding-left': {
        match: /^scroll-pl:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-padding-right': {
        match: /^scroll-pr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-padding-top': {
        match: /^scroll-pt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-padding-bottom': {
        match: /^scroll-pb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-padding-x': {
        match: /^(?:scroll-padding-x|scroll-px):/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'scroll-padding-left': value + unit,
                'scroll-padding-right': value + unit
            }
        },
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-padding-y': {
        match: /^(?:scroll-padding-y|scroll-py):/,
        unit: 'rem',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'scroll-padding-top': value + unit,
                'scroll-padding-bottom': value + unit
            }
        },
        variableGroups: ['spacing']
    } as RuleOptions,
    'scroll-padding': {
        match: /^scroll-p:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // scroll snap
    'scroll-snap-align': {
        match: ['scroll-snap', ['start', 'end', 'center']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'scroll-snap-stop': {
        match: ['scroll-snap', ['normal', 'always']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'scroll-snap-type': {
        match: ['scroll-snap', ['x', 'y', 'block', 'inline', 'both']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'will-change': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'writing-mode': {
        match: /^writing:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    direction: {
        layer: Layer.CoreNative
    } as RuleOptions,
    'shape-outside': {
        match: ['shape', ['(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleOptions,
    'shape-margin': {
        match: ['shape'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    'shapeImage-threshold': {
        layer: Layer.CoreNative
    } as RuleOptions,
    'clip-path': {
        match: /^clip:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    quotes: {
        layer: Layer.CoreNative
    } as RuleOptions,
    'mask-image': {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'mask-image': value + unit,
                '-webkit-mask-image': value + unit
            }
        }
    } as RuleOptions
}

export default rules