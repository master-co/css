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
    fontSize: {
        match: ['f(?:ont)?'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    fontWeight: {
        match: ['f(?:ont)?', ['bolder']],
        layer: Layer.CoreNative
    } as RuleOptions,
    fontFamily: {
        match: ['f(?:ont)?'],
        layer: Layer.CoreNative
    } as RuleOptions,
    fontSmoothing: {
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
    fontStyle: {
        match: ['f(?:ont)?', ['normal', 'italic', 'oblique']],
        layer: Layer.CoreNative,
        unit: 'deg'
    } as RuleOptions,
    fontVariantNumeric: {
        match: ['f(?:ont)?', ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions']],
        layer: Layer.CoreNative
    } as RuleOptions,
    fontVariant: {
        layer: Layer.CoreNativeShorthand
    },
    fontFeatureSettings: {
        match: /^font-feature:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    font: {
        match: /^f:/,
        layer: Layer.CoreNativeShorthand,
        variableGroups: [
            'fontFamily',
            'fontVariant',
            'fontWeight',
            'fontSize',
            'fontStyle',
            'lineHeight'
        ]
    } as RuleOptions,
    color: {
        match: /^(?:color|fg|foreground):/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    // margin
    marginLeft: {
        match: /^ml:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    marginRight: {
        match: /^mr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    marginTop: {
        match: /^mt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    marginBottom: {
        match: /^mb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    marginX: {
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
    marginY: {
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
    marginInlineStart: {
        match: /^mis:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    marginInlineEnd: {
        match: /^mie:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    marginInline: {
        match: /^mi:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // padding
    paddingLeft: {
        match: /^pl:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    paddingRight: {
        match: /^pr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    paddingTop: {
        match: /^pt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    paddingBottom: {
        match: /^pb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    paddingX: {
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
    paddingY: {
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
    paddingInlineStart: {
        match: /^pis:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    paddingInlineEnd: {
        match: /^pie:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    paddingInline: {
        match: /^pi:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // flex
    flexBasis: {
        variableGroups: ['sizing'],
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    flexWrap: {
        match: ['flex', ['wrap', 'nowrap', 'wrap-reverse']],
        layer: Layer.CoreNative
    } as RuleOptions,
    flexGrow: {
        layer: Layer.CoreNative
    } as RuleOptions,
    flexShrink: {
        layer: Layer.CoreNative
    } as RuleOptions,
    flexDirection: {
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
    minWidth: {
        match: /^min-w:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    minHeight: {
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
    minBox: {
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
    maxBox: {
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
    boxSizing: {
        match: /^box:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    boxDecorationBreak: {
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
    counterIncrement: {
        layer: Layer.CoreNative
    } as RuleOptions,
    counterReset: {
        layer: Layer.CoreNative,
    } as RuleOptions,
    letterSpacing: {
        match: /^ls:/,
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleOptions,
    lineHeight: {
        match: /^lh:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    objectFit: {
        match: ['(?:object|obj)', ['contain', 'cover', 'fill', 'scale-down']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    objectPosition: {
        match: ['(?:object|obj)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    textAlign: {
        match: ['t(?:ext)?', ['justify', 'center', 'left', 'right', 'start', 'end']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    textDecorationColor: {
        match: ['text-decoration'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    textDecorationStyle: {
        match: ['t(?:ext)?', ['solid', 'double', 'dotted', 'dashed', 'wavy']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    textDecorationThickness: {
        match: ['text-decoration', ['from-font']],
        numeric: true,
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleOptions,
    textDecorationLine: {
        match: ['t(?:ext)?', ['none', 'underline', 'overline', 'line-through']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    textDecoration: {
        match: ['t(?:ext)?', ['underline', 'overline', 'line-through']],
        unit: 'rem',
        colored: true,
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    textUnderlineOffset: {
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    textOverflow: {
        match: ['t(?:ext)?', ['ellipsis', 'clip']],
        layer: Layer.CoreNative
    } as RuleOptions,
    textOrientation: {
        match: ['t(?:ext)?', ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation']],
        layer: Layer.CoreNative
    } as RuleOptions,
    textTransform: {
        match: ['t(?:ext)?', ['uppercase', 'lowercase', 'capitalize']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    textRendering: {
        match: ['t(?:ext)?', ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision']],
        layer: Layer.CoreNative,
    } as RuleOptions,
    textIndent: {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    verticalAlign: {
        match: /^(?:v|vertical):/,
        layer: Layer.CoreNative
    } as RuleOptions,
    columns: {
        match: /^(?:columns|cols):/,
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    whiteSpace: {
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
    maxHeight: {
        match: /^max-h:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    maxWidth: {
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
    overflowX: {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-x': ['auto', value] }
                : { 'overflow-x': value }
        }
    } as RuleOptions,
    overflowY: {
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
    overscrollBehaviorX: {
        layer: Layer.CoreNative
    } as RuleOptions,
    overscrollBehaviorY: {
        layer: Layer.CoreNative
    } as RuleOptions,
    overscrollBehavior: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    zIndex: {
        match: /^z:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    position: {
        layer: Layer.CoreNative
    } as RuleOptions,
    cursor: {
        layer: Layer.CoreNative
    } as RuleOptions,
    pointerEvents: {
        layer: Layer.CoreNative
    } as RuleOptions,
    resize: {
        layer: Layer.CoreNative
    } as RuleOptions,
    touchAction: {
        layer: Layer.CoreNative
    } as RuleOptions,
    wordBreak: {
        layer: Layer.CoreNative
    } as RuleOptions,
    wordSpacing: {
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleOptions,
    userDrag: {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'user-drag': value + unit,
                '-webkit-user-drag': value + unit
            }
        }
    } as RuleOptions,
    userSelect: {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'user-select': value + unit,
                '-webkit-user-select': value + unit
            }
        }
    } as RuleOptions,
    textShadow: {
        unit: 'rem',
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    textSize: {
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
    textFillColor: {
        match: ['(?:text-fill|text|t)'],
        layer: Layer.CoreNative,
        colored: true,
        declare(value, unit) {
            return {
                '-webkit-text-fill-color': value + unit
            }
        }
    } as RuleOptions,
    textStrokeWidth: {
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
    textStrokeColor: {
        match: ['text-stroke'],
        layer: Layer.CoreNative,
        colored: true,
        declare(value, unit) {
            return {
                '-webkit-text-stroke-color': value + unit
            }
        }
    } as RuleOptions,
    textStroke: {
        unit: 'rem',
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                '-webkit-text-stroke': value + unit
            }
        }
    } as RuleOptions,
    boxShadow: {
        match: /^s(?:hadow)?:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    tableLayout: {
        layer: Layer.CoreNative
    } as RuleOptions,
    transformBox: {
        match: ['transform'],
        layer: Layer.CoreNative
    } as RuleOptions,
    transformStyle: {
        match: ['transform', ['flat', 'preserve-3d']],
        layer: Layer.CoreNative
    } as RuleOptions,
    transformOrigin: {
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
    transitionProperty: {
        match: /^~property:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    transitionTimingFunction: {
        match: /^~easing:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    transitionDuration: {
        match: /^~duration:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleOptions,
    transitionDelay: {
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
    animationDelay: {
        match: /^@delay:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleOptions,
    animationDirection: {
        match: /^@direction:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    animationDuration: {
        match: /^@duration:/,
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleOptions,
    animationFillMode: {
        match: /^@fill:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    animationIterationCount: {
        match: /^@iteration:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    animationName: {
        match: /^@name:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    animationPlayState: {
        match: /^@play:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    animationTimingFunction: {
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
    borderCollapse: {
        match: ['b(?:order)?', ['collapse', 'separate']],
        layer: Layer.CoreNative
    } as RuleOptions,
    borderSpacing: {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    // border color
    borderTopColor: {
        match: ['b(?:t|order-top(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    borderBottomColor: {
        match: ['b(?:b|order-bottom(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    borderLeftColor: {
        match: ['b(?:l|order-left(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    borderRightColor: {
        match: ['b(?:r|order-right(?:-color)?)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    borderXColor: {
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
    borderYColor: {
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
    borderColor: {
        match: ['b(?:order)?(?:-color)?'],
        layer: Layer.CoreNativeShorthand,
        colored: true
    } as RuleOptions,
    // border radius
    borderTopLeftRadius: {
        match: /^r(?:tl|lt):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    borderTopRightRadius: {
        match: /^r(?:tr|rt):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    borderBottomLeftRadius: {
        match: /^r(?:bl|lb):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    borderBottomRightRadius: {
        match: /^r(?:br|rb):/,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    borderTopRadius: {
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
    borderBottomRadius: {
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
    borderLeftRadius: {
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
    borderRightRadius: {
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
    borderRadius: {
        match: /^r:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    // border style
    borderTopStyle: {
        match: ['b(?:t|order-top(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleOptions,
    borderBottomStyle: {
        match: ['b(?:b|order-bottom(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleOptions,
    borderLeftStyle: {
        match: ['b(?:l|order-left(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleOptions,
    borderRightStyle: {
        match: ['b(?:r|order-right(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreNative,
    } as RuleOptions,
    borderXStyle: {
        match: ['b(?:x|order-x(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-left-style': value + unit,
                'border-right-style': value + unit
            }
        }
    } as RuleOptions,
    borderYStyle: {
        match: ['b(?:y|order-y(?:-style)?)', BORDER_STYLES],
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-top-style': value + unit,
                'border-bottom-style': value + unit
            }
        }
    } as RuleOptions,
    borderStyle: {
        match: ['b(?:order)?(?:-style)?', BORDER_STYLES],
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    // border width
    borderTopWidth: {
        match: ['b(?:t|order-top(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    borderBottomWidth: {
        match: ['b(?:b|order-bottom(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    borderLeftWidth: {
        match: ['b(?:l|order-left(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    borderRightWidth: {
        match: ['b(?:r|order-right(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleOptions,
    borderXWidth: {
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
    borderYWidth: {
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
    borderWidth: {
        match: ['b(?:order)?(?:-width)?'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    // border image
    borderImageOutset: {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    borderImageRepeat: {
        match: ['border-image', ['stretch', 'repeat', 'round', 'space']],
        layer: Layer.CoreNative
    } as RuleOptions,
    borderImageSlice: {
        layer: Layer.CoreNative
    } as RuleOptions,
    borderImageSource: {
        match: ['border-image', ['url', 'linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient']],
        layer: Layer.CoreNative
    } as RuleOptions,
    borderImageWidth: {
        match: ['border-image', ['auto']],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    borderImage: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    // border
    borderTop: {
        match: /^bt:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true
    } as RuleOptions,
    borderBottom: {
        match: /^bb:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true
    } as RuleOptions,
    borderLeft: {
        match: /^bl:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true
    } as RuleOptions,
    borderRight: {
        match: /^br:/,
        layer: Layer.CoreNativeShorthand,
        unit: 'rem',
        colored: true
    } as RuleOptions,
    borderX: {
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
    borderY: {
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
    backgroundAttachment: {
        match: ['(?:bg|background)', ['fixed', 'local', 'scroll']],
        layer: Layer.CoreNative
    } as RuleOptions,
    backgroundBlendMode: {
        layer: Layer.CoreNative
    } as RuleOptions,
    backgroundColor: {
        match: ['(?:bg|background)'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    backgroundClip: {
        match: ['(?:bg|background)', ['text']],
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                '-webkit-background-clip': value + unit,
                'background-clip': value + unit
            }
        }
    } as RuleOptions,
    backgroundOrigin: {
        match: ['(?:bg|background)'],
        layer: Layer.CoreNative
    } as RuleOptions,
    backgroundPosition: {
        match: ['(?:bg|background)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: Layer.CoreNative,
        unit: 'px'
    } as RuleOptions,
    backgroundRepeat: {
        match: ['(?:bg|background)', ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y']],
        layer: Layer.CoreNative
    } as RuleOptions,
    backgroundSize: {
        match: ['(?:bg|background)', ['auto', 'cover', 'contain']],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleOptions,
    backgroundImage: {
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
    mixBlendMode: {
        match: /^blend:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    backdropFilter: {
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
    strokeDasharray: {
        layer: Layer.CoreNative
    } as RuleOptions,
    strokeDashoffset: {
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    strokeWidth: {
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
    gridColumnStart: {
        match: /^grid-col-start:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    gridColumnEnd: {
        match: /^grid-col-end:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    gridColumn: {
        match: /^grid-col(?:umn)?(?:-span)?:/,
        layer: Layer.CoreNativeShorthand,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleOptions,
    gridColumns: {
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
    gridRowStart: {
        layer: Layer.CoreNative
    } as RuleOptions,
    gridRowEnd: {
        layer: Layer.CoreNative
    } as RuleOptions,
    gridRow: {
        match: /^grid-row-span:/,
        layer: Layer.CoreNativeShorthand,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleOptions,
    gridRows: {
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
    gridAutoColumns: {
        match: /^grid-auto-cols:/,
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    gridAutoFlow: {
        match: /^grid-flow:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    gridAutoRows: {
        layer: Layer.CoreNative,
        variableGroups: ['sizing']
    } as RuleOptions,
    gridTemplateAreas: {
        layer: Layer.CoreNative
    } as RuleOptions,
    gridTemplateColumns: {
        match: /^grid-template-cols:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['sizing']
    } as RuleOptions,
    gridTemplateRows: {
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['sizing']
    } as RuleOptions,
    gridTemplate: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    gridArea: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    grid: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    columnGap: {
        match: /^gap-x:/,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    rowGap: {
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
    breakInside: {
        layer: Layer.CoreNative
    } as RuleOptions,
    breakBefore: {
        layer: Layer.CoreNative
    } as RuleOptions,
    breakAfter: {
        layer: Layer.CoreNative
    } as RuleOptions,
    aspectRatio: {
        match: /^aspect:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    columnSpan: {
        match: /^col-span:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    alignContent: {
        match: /^ac:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    alignItems: {
        match: /^ai:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    alignSelf: {
        match: /^as:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    justifyContent: {
        match: /^jc:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    justifyItems: {
        match: /^ji:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    justifySelf: {
        match: /^js:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    placeContent: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    placeItems: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    placeSelf: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    listStylePosition: {
        match: ['list-style', ['inside', 'outside']],
        layer: Layer.CoreNative
    } as RuleOptions,
    listStyleType: {
        match: ['list-style', ['disc', 'decimal']],
        layer: Layer.CoreNative
    } as RuleOptions,
    listStyleImage: {
        match: ['list-style', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleOptions,
    listStyle: {
        layer: Layer.CoreNativeShorthand
    } as RuleOptions,
    outlineColor: {
        match: ['outline'],
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    outlineOffset: {
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    outlineStyle: {
        match: ['outline', ['dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: Layer.CoreNative
    } as RuleOptions,
    outlineWidth: {
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
    accentColor: {
        match: /^accent:/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    appearance: {
        layer: Layer.CoreNative
    } as RuleOptions,
    caretColor: {
        match: /^caret:/,
        layer: Layer.CoreNative,
        colored: true
    } as RuleOptions,
    scrollBehavior: {
        layer: Layer.CoreNative
    } as RuleOptions,
    // scroll margin
    scrollMarginLeft: {
        match: /^scroll-ml:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    scrollMarginRight: {
        match: /^scroll-mr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    scrollMarginTop: {
        match: /^scroll-mt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    scrollMarginBottom: {
        match: /^scroll-mb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    scrollMarginX: {
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
    scrollMarginY: {
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
    scrollMargin: {
        match: /^scroll-m:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // scroll padding
    scrollPaddingLeft: {
        match: /^scroll-pl:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    scrollPaddingRight: {
        match: /^scroll-pr:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    scrollPaddingTop: {
        match: /^scroll-pt:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    scrollPaddingBottom: {
        match: /^scroll-pb:/,
        layer: Layer.CoreNative,
        unit: 'rem',
        variableGroups: ['spacing']
    } as RuleOptions,
    scrollPaddingX: {
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
    scrollPaddingY: {
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
    scrollPadding: {
        match: /^scroll-p:/,
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        variableGroups: ['spacing']
    } as RuleOptions,
    // scroll snap
    scrollSnapAlign: {
        match: ['scroll-snap', ['start', 'end', 'center']],
        layer: Layer.CoreNative
    } as RuleOptions,
    scrollSnapStop: {
        match: ['scroll-snap', ['normal', 'always']],
        layer: Layer.CoreNative
    } as RuleOptions,
    scrollSnapType: {
        match: ['scroll-snap', ['x', 'y', 'block', 'inline', 'both']],
        layer: Layer.CoreNative
    } as RuleOptions,
    willChange: {
        layer: Layer.CoreNative
    } as RuleOptions,
    writingMode: {
        match: /^writing:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    direction: {
        layer: Layer.CoreNative
    } as RuleOptions,
    shapeOutside: {
        match: ['shape', ['(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)']],
        layer: Layer.CoreNative
    } as RuleOptions,
    shapeMargin: {
        match: ['shape'],
        numeric: true,
        unit: 'rem',
        layer: Layer.CoreNative,
        variableGroups: ['spacing']
    } as RuleOptions,
    shapeImageThreshold: {
        layer: Layer.CoreNative
    } as RuleOptions,
    clipPath: {
        match: /^clip:/,
        layer: Layer.CoreNative
    } as RuleOptions,
    quotes: {
        layer: Layer.CoreNative
    } as RuleOptions,
    maskImage: {
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