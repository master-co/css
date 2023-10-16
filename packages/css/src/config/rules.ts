import cssEscape from 'shared/utils/css-escape'
import { START_SYMBOLS } from '../constants/start-symbol'
import type { Rule } from '../rule'
import { CSSDeclarations } from '../types/css-declarations'
import { CoreLayer } from '../layer'
import { RuleOptions } from './'

const rules = {
    group: {
        match: /^(?:.+?[*_>~+])?\{.+?\}/,
        layer: CoreLayer.Normal,
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
            const propsByTheme: Record<string, Record<string, string>> = {}

            const addProp = (theme: string, propertyName: string) => {
                const indexOfColon = propertyName.indexOf(':')
                if (indexOfColon !== -1) {
                    if (!(theme in propsByTheme)) {
                        propsByTheme[theme] = {}
                    }

                    const props = propsByTheme[theme]
                    const name = propertyName.slice(0, indexOfColon)
                    if (!(name in props)) {
                        props[name] = propertyName.slice(indexOfColon + 1)
                    }
                }
            }
            const handleRule = (rule: Rule) => {
                const addProps = (theme: string, cssText: string) => {
                    const cssProperties = cssText.slice(cssEscape(rule.className).length).match(/\{(.*)\}/)[1].split(';')
                    for (const eachCssProperty of cssProperties) {
                        addProp(theme, eachCssProperty)
                    }
                }

                if (this.theme) {
                    const currentThemeNative = rule.natives.find(eachNative => eachNative.theme === this.theme) ?? rule.natives.find(eachNative => !eachNative.theme)
                    if (currentThemeNative) {
                        addProps(this.theme, currentThemeNative.text)
                    }
                } else {
                    for (const eachNative of rule.natives) {
                        addProps(eachNative.theme, eachNative.text)
                    }
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
                const result = this.css.create(eachName)
                if (Array.isArray(result)) {
                    if (result.length) {
                        for (const eachRule of result) {
                            handleRule(eachRule)
                        }
                    } else {
                        addProp(this.theme ?? '', eachName)
                    }
                } else {
                    handleRule(result)
                }
            }

            const declarations: CSSDeclarations = {}
            for (const theme in propsByTheme) {
                for (const [eachName, eachValue] of Object.entries(propsByTheme[theme])) {
                    if (eachName in declarations) {
                        declarations[eachName][theme] = eachValue
                    } else {
                        declarations[eachName] = {
                            [theme]: eachValue
                        }
                    }
                }
            }

            return declarations
        }
    } as RuleOptions,
    variable: {
        match: /^\$[\w-]+:./, // don't use 'rem' as default, because css variable is common API
        colored: true,
        layer: CoreLayer.Normal,
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
        layer: CoreLayer.Native
    } as RuleOptions,
    fontWeight: {
        match: ['f(?:ont)?', ['bolder']],
        layer: CoreLayer.Native
    } as RuleOptions,
    fontFamily: {
        match: ['f(?:ont)?'],
        layer: CoreLayer.Native
    } as RuleOptions,
    fontSmoothing: {
        match: ['f(?:ont)?', ['antialiased', 'subpixel-antialiased']],
        layer: CoreLayer.Native,
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
        layer: CoreLayer.Native,
        unit: 'deg'
    } as RuleOptions,
    fontVariantNumeric: {
        match: ['f(?:ont)?', ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions']],
        layer: CoreLayer.Native
    } as RuleOptions,
    fontVariant: {
        layer: CoreLayer.NativeShorthand
    },
    fontFeatureSettings: {
        match: /^font-feature:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    font: {
        match: /^f:./,
        layer: CoreLayer.NativeShorthand,
        variables: [
            'fontFamily',
            'fontVariant',
            'fontWeight',
            'fontSize',
            'fontStyle',
            'lineHeight'
        ]
    } as RuleOptions,
    color: {
        match: /^(?:color|fg|foreground):./,
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    // margin
    marginLeft: {
        match: /^ml:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    marginRight: {
        match: /^mr:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    marginTop: {
        match: /^mt:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    marginBottom: {
        match: /^mb:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    marginX: {
        match: /^(?:mx|margin-x):./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'margin-left': value + unit,
                'margin-right': value + unit
            }
        },
        variables: ['spacing']
    } as RuleOptions,
    marginY: {
        match: /^(?:my|margin-y):./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'margin-top': value + unit,
                'margin-bottom': value + unit
            }
        },
        variables: ['spacing']
    } as RuleOptions,
    margin: {
        match: /^m:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as RuleOptions,
    // margin inline
    marginInlineStart: {
        match: /^mis:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    marginInlineEnd: {
        match: /^mie:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    marginInline: {
        match: /^mi:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as RuleOptions,
    // padding
    paddingLeft: {
        match: /^pl:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    paddingRight: {
        match: /^pr:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    paddingTop: {
        match: /^pt:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    paddingBottom: {
        match: /^pb:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    paddingX: {
        match: /^(?:px|padding-x):./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'padding-left': value + unit,
                'padding-right': value + unit
            }
        },
        variables: ['spacing']
    } as RuleOptions,
    paddingY: {
        match: /^(?:py|padding-y):./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'padding-top': value + unit,
                'padding-bottom': value + unit
            }
        },
        variables: ['spacing']
    } as RuleOptions,
    padding: {
        match: /^p:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as RuleOptions,
    // padding inline
    paddingInlineStart: {
        match: /^pis:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    paddingInlineEnd: {
        match: /^pie:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    paddingInline: {
        match: /^pi:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as RuleOptions,
    // flex
    flexBasis: {
        variables: [
            {
                full: '100%',
                fit: 'fit-content',
                max: 'max-content',
                min: 'min-content'
            },
            'viewport'
        ],
        unit: 'rem',
        layer: CoreLayer.Native,
    } as RuleOptions,
    flexWrap: {
        match: ['flex', ['wrap', 'nowrap', 'wrap-reverse']],
        layer: CoreLayer.Native
    } as RuleOptions,
    flexGrow: {
        layer: CoreLayer.Native
    } as RuleOptions,
    flexShrink: {
        layer: CoreLayer.Native
    } as RuleOptions,
    flexDirection: {
        match: ['flex', ['row', 'row-reverse', 'column', 'column-reverse']],
        layer: CoreLayer.Native,
        variables: {
            col: 'column',
            'col-reverse': 'column-reverse'
        }
    } as RuleOptions,
    flex: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    display: {
        match: /^d:./,
        layer: CoreLayer.Native,
    } as RuleOptions,
    width: {
        match: /^w:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: [
            {
                full: '100%',
                fit: 'fit-content',
                max: 'max-content',
                min: 'min-content'
            },
            'viewport'
        ]
    } as RuleOptions,
    Height: {
        match: /^h:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: [
            {
                full: '100%',
                fit: 'fit-content',
                max: 'max-content',
                min: 'min-content'
            },
            'viewport'
        ]
    } as RuleOptions,
    minWidth: {
        match: /^min-w:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: [
            {
                full: '100%',
                fit: 'fit-content',
                max: 'max-content',
                min: 'min-content'
            },
            'viewport'
        ]
    } as RuleOptions,
    minHeight: {
        match: /^min-h:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: [
            {
                full: '100%',
                fit: 'fit-content',
                max: 'max-content',
                min: 'min-content'
            },
            'viewport'
        ]
    } as RuleOptions,
    box: {
        match: /^(?:(?:max|min|clamp|calc)\(.+\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\(.+\)|[0-9]+[a-z]*?)/,
        layer: CoreLayer.Shorthand,
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
        match: /^min:./,
        layer: CoreLayer.Shorthand,
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
        match: /^max:./,
        layer: CoreLayer.Shorthand,
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
        match: /^box:./,
        layer: CoreLayer.Native,
        variables: {
            content: 'content-box',
            border: 'border-box',
        }
    } as RuleOptions,
    boxDecorationBreak: {
        match: ['box', ['slice', 'clone']],
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                'box-decoration-break': value + unit,
                '-webkit-box-decoration-break': value + unit
            }
        }
    } as RuleOptions,
    contain: {
        layer: CoreLayer.Native
    } as RuleOptions,
    content: {
        layer: CoreLayer.Native
    } as RuleOptions,
    counterIncrement: {
        layer: CoreLayer.Native
    } as RuleOptions,
    counterReset: {
        layer: CoreLayer.Native,
    } as RuleOptions,
    letterSpacing: {
        match: /^ls:./,
        layer: CoreLayer.Native,
        unit: 'em'
    } as RuleOptions,
    lineHeight: {
        match: /^lh:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    objectFit: {
        match: ['(?:object|obj)', ['contain', 'cover', 'fill', 'scale-down']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    objectPosition: {
        match: ['(?:object|obj)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    textAlign: {
        match: ['t(?:ext)?', ['justify', 'center', 'left', 'right', 'start', 'end']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    textDecorationColor: {
        match: ['text-decoration'],
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    textDecorationStyle: {
        match: ['t(?:ext)?', ['solid', 'double', 'dotted', 'dashed', 'wavy']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    textDecorationThickness: {
        match: ['text-decoration', ['from-font']],
        numeric: true,
        layer: CoreLayer.Native,
        unit: 'em'
    } as RuleOptions,
    textDecorationLine: {
        match: ['t(?:ext)?', ['none', 'underline', 'overline', 'line-through']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    textDecoration: {
        match: ['t(?:ext)?', ['underline', 'overline', 'line-through']],
        unit: 'rem',
        colored: true,
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    textUnderlineOffset: {
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    textOverflow: {
        match: ['t(?:ext)?', ['ellipsis', 'clip']],
        layer: CoreLayer.Native
    } as RuleOptions,
    textOrientation: {
        match: ['t(?:ext)?', ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation']],
        layer: CoreLayer.Native
    } as RuleOptions,
    textTransform: {
        match: ['t(?:ext)?', ['uppercase', 'lowercase', 'capitalize']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    textRendering: {
        match: ['t(?:ext)?', ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    textIndent: {
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    verticalAlign: {
        match: /^(?:v|vertical):./,
        layer: CoreLayer.Native
    } as RuleOptions,
    columns: {
        match: /^(?:columns|cols):./,
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    whiteSpace: {
        layer: CoreLayer.Native
    } as RuleOptions,
    top: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    bottom: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    left: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    right: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    inset: {
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as RuleOptions,
    lines: {
        match: /^lines:./,
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
        match: /^max-h:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: [
            {
                full: '100%',
                fit: 'fit-content',
                max: 'max-content',
                min: 'min-content'
            },
            'viewport'
        ]
    } as RuleOptions,
    maxWidth: {
        match: /^max-w:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: [
            {
                full: '100%',
                fit: 'fit-content',
                max: 'max-content',
                min: 'min-content'
            },
            'viewport'
        ]
    } as RuleOptions,
    opacity: {
        layer: CoreLayer.Native,
    } as RuleOptions,
    visibility: {
        layer: CoreLayer.Native
    } as RuleOptions,
    clear: {
        layer: CoreLayer.Native,
    } as RuleOptions,
    float: {
        layer: CoreLayer.Native
    } as RuleOptions,
    isolation: {
        layer: CoreLayer.Native
    } as RuleOptions,
    overflowX: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-x': ['auto', value] }
                : { 'overflow-x': value }
        }
    } as RuleOptions,
    overflowY: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-y': ['auto', value] }
                : { 'overflow-y': value }
        }
    } as RuleOptions,
    overflow: {
        layer: CoreLayer.NativeShorthand,
        declare(value, unit) {
            return value === 'overlay'
                ? { overflow: ['auto', value] }
                : { overflow: value }
        }
    } as RuleOptions,
    overscrollBehaviorX: {
        layer: CoreLayer.Native
    } as RuleOptions,
    overscrollBehaviorY: {
        layer: CoreLayer.Native
    } as RuleOptions,
    overscrollBehavior: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    zIndex: {
        match: /^z:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    position: {
        layer: CoreLayer.Native,
        variables: {
            abs: 'absolute',
            rel: 'relative'
        }
    } as RuleOptions,
    cursor: {
        layer: CoreLayer.Native
    } as RuleOptions,
    pointerEvents: {
        layer: CoreLayer.Native
    } as RuleOptions,
    resize: {
        layer: CoreLayer.Native
    } as RuleOptions,
    touchAction: {
        layer: CoreLayer.Native
    } as RuleOptions,
    wordBreak: {
        layer: CoreLayer.Native
    } as RuleOptions,
    wordSpacing: {
        layer: CoreLayer.Native,
        unit: 'em'
    } as RuleOptions,
    userDrag: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                'user-drag': value + unit,
                '-webkit-user-drag': value + unit
            }
        }
    } as RuleOptions,
    userSelect: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                'user-select': value + unit,
                '-webkit-user-select': value + unit
            }
        }
    } as RuleOptions,
    textShadow: {
        unit: 'rem',
        layer: CoreLayer.Native,
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
        layer: CoreLayer.Native,
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
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                '-webkit-text-stroke-width': value + unit
            }
        },
    } as RuleOptions,
    textStrokeColor: {
        match: ['text-stroke'],
        layer: CoreLayer.Native,
        colored: true,
        declare(value, unit) {
            return {
                '-webkit-text-stroke-color': value + unit
            }
        }
    } as RuleOptions,
    textStroke: {
        unit: 'rem',
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                '-webkit-text-stroke': value + unit
            }
        }
    } as RuleOptions,
    boxShadow: {
        match: /^s(?:hadow)?:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    tableLayout: {
        layer: CoreLayer.Native
    } as RuleOptions,
    transformBox: {
        match: ['transform'],
        layer: CoreLayer.Native,
        variables: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box',
            fill: 'fill-box',
            stroke: 'stroke-box',
            view: 'view-box'
        }
    } as RuleOptions,
    transformStyle: {
        match: ['transform', ['flat', 'preserve-3d']],
        layer: CoreLayer.Native
    } as RuleOptions,
    transformOrigin: {
        match: ['transform', ['top', 'bottom', 'right', 'left', 'center']],
        numeric: true,
        unit: 'px',
        layer: CoreLayer.Native
    } as RuleOptions,
    transform: {
        match: /^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\(/,
        layer: CoreLayer.Native,
        analyze(className: string) {
            return [className.startsWith('transform') ? className.slice(10) : className]
        },
        variables: ['spacing']
    } as RuleOptions,
    transitionProperty: {
        match: /^~property:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    transitionTimingFunction: {
        match: /^~easing:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    transitionDuration: {
        match: /^~duration:./,
        layer: CoreLayer.Native,
        unit: 'ms'
    } as RuleOptions,
    transitionDelay: {
        match: /^~delay:./,
        layer: CoreLayer.Native,
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
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    animationDelay: {
        match: /^@delay:./,
        layer: CoreLayer.Native,
        unit: 'ms'
    } as RuleOptions,
    animationDirection: {
        match: /^@direction:./,
        layer: CoreLayer.Native,
        variables: {
            alt: 'alternate',
            'alt-reverse': 'alternate-reverse'
        }
    } as RuleOptions,
    animationDuration: {
        match: /^@duration:./,
        layer: CoreLayer.Native,
        unit: 'ms'
    } as RuleOptions,
    animationFillMode: {
        match: /^@fill:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    animationIterationCount: {
        match: /^@iteration:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    animationName: {
        match: /^@name:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    animationPlayState: {
        match: /^@play:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    animationTimingFunction: {
        match: /^@easing:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    animation: {
        match: /^@[^!*>+~:[@_]+\|/,
        layer: CoreLayer.NativeShorthand,
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
        layer: CoreLayer.Native
    } as RuleOptions,
    borderSpacing: {
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    // border color
    borderTopColor: {
        match: ['b(?:t|order-top(?:-color)?)'],
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    borderBottomColor: {
        match: ['b(?:b|order-bottom(?:-color)?)'],
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    borderLeftColor: {
        match: ['b(?:l|order-left(?:-color)?)'],
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    borderRightColor: {
        match: ['b(?:r|order-right(?:-color)?)'],
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    borderXColor: {
        match: ['b(?:x|order-x(?:-color)?)'],
        layer: CoreLayer.Shorthand,
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
        layer: CoreLayer.Shorthand,
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
        layer: CoreLayer.NativeShorthand,
        colored: true
    } as RuleOptions,
    // border radius
    borderTopLeftRadius: {
        match: /^r(?:tl|lt):./,
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    borderTopRightRadius: {
        match: /^r(?:tr|rt):./,
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    borderBottomLeftRadius: {
        match: /^r(?:bl|lb):./,
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    borderBottomRightRadius: {
        match: /^r(?:br|rb):./,
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    borderTopRadius: {
        match: /^rt:./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'border-top-left-radius': value + unit,
                'border-top-right-radius': value + unit
            }
        }
    } as RuleOptions,
    borderBottomRadius: {
        match: /^rb:./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'border-bottom-left-radius': value + unit,
                'border-bottom-right-radius': value + unit
            }
        }
    } as RuleOptions,
    borderLeftRadius: {
        match: /^rl:./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'border-top-left-radius': value + unit,
                'border-bottom-left-radius': value + unit
            }
        }
    } as RuleOptions,
    borderRightRadius: {
        match: /^rr:./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'border-top-right-radius': value + unit,
                'border-bottom-right-radius': value + unit
            }
        }
    } as RuleOptions,
    borderRadius: {
        match: /^r:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    // border style
    borderTopStyle: {
        match: ['b(?:t|order-top(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    borderBottomStyle: {
        match: ['b(?:b|order-bottom(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    borderLeftStyle: {
        match: ['b(?:l|order-left(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    borderRightStyle: {
        match: ['b(?:r|order-right(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native,
    } as RuleOptions,
    borderXStyle: {
        match: ['b(?:x|order-x(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'border-left-style': value + unit,
                'border-right-style': value + unit
            }
        }
    } as RuleOptions,
    borderYStyle: {
        match: ['b(?:y|order-y(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'border-top-style': value + unit,
                'border-bottom-style': value + unit
            }
        }
    } as RuleOptions,
    borderStyle: {
        match: ['b(?:order)?(?:-style)?', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    // border width
    borderTopWidth: {
        match: ['b(?:t|order-top(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
    } as RuleOptions,
    borderBottomWidth: {
        match: ['b(?:b|order-bottom(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
    } as RuleOptions,
    borderLeftWidth: {
        match: ['b(?:l|order-left(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
    } as RuleOptions,
    borderRightWidth: {
        match: ['b(?:r|order-right(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
    } as RuleOptions,
    borderXWidth: {
        match: ['b(?:x|order-x(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
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
        layer: CoreLayer.Shorthand,
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
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    // border image
    borderImageOutset: {
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    borderImageRepeat: {
        match: ['border-image', ['stretch', 'repeat', 'round', 'space']],
        layer: CoreLayer.Native
    } as RuleOptions,
    borderImageSlice: {
        layer: CoreLayer.Native
    } as RuleOptions,
    borderImageSource: {
        match: ['border-image', ['url', 'linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient']],
        layer: CoreLayer.Native
    } as RuleOptions,
    borderImageWidth: {
        match: ['border-image', ['auto']],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    borderImage: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    // border
    borderTop: {
        match: /^bt:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        colored: true,
        transform(value) {
            if (!/hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleOptions,
    borderBottom: {
        match: /^bb:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        colored: true,
        transform(value) {
            if (!/hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleOptions,
    borderLeft: {
        match: /^bl:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        colored: true,
        transform(value) {
            if (!/hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleOptions,
    borderRight: {
        match: /^br:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        colored: true,
        transform(value) {
            if (!/hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleOptions,
    borderX: {
        match: /^(?:bx|border-x):./,
        unit: 'rem',
        colored: true,
        layer: CoreLayer.Shorthand,
        transform(value) {
            if (!/hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        },
        declare(value) {
            return {
                'border-left': value,
                'border-right': value
            }
        }
    } as RuleOptions,
    borderY: {
        match: /^(?:by|border-y):./,
        unit: 'rem',
        colored: true,
        layer: CoreLayer.Shorthand,
        transform(value) {
            if (!/hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        },
        declare(value) {
            return {
                'border-top': value,
                'border-bottom': value
            }
        }
    } as RuleOptions,
    border: {
        match: /^b:./,
        unit: 'rem',
        colored: true,
        transform(value) {
            if (!/hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        },
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    backgroundAttachment: {
        match: ['(?:bg|background)', ['fixed', 'local', 'scroll']],
        layer: CoreLayer.Native
    } as RuleOptions,
    backgroundBlendMode: {
        layer: CoreLayer.Native
    } as RuleOptions,
    backgroundColor: {
        match: ['(?:bg|background)'],
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    backgroundClip: {
        match: ['(?:bg|background)', ['text']],
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                '-webkit-background-clip': value + unit,
                'background-clip': value + unit
            }
        },
        variables: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box'
        }
    } as RuleOptions,
    backgroundOrigin: {
        match: ['(?:bg|background)'],
        layer: CoreLayer.Native,
        variables: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box'
        }
    } as RuleOptions,
    backgroundPosition: {
        match: ['(?:bg|background)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: CoreLayer.Native,
        unit: 'px'
    } as RuleOptions,
    backgroundRepeat: {
        match: ['(?:bg|background)', ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y']],
        layer: CoreLayer.Native
    } as RuleOptions,
    backgroundSize: {
        match: ['(?:bg|background)', ['auto', 'cover', 'contain']],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    backgroundImage: {
        match: ['(?:bg|background)', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: CoreLayer.Native
    } as RuleOptions,
    background: {
        match: /^bg:./,
        colored: true,
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    gradient: {
        match: /^gradient\(/,
        layer: CoreLayer.Native,
        colored: true,
        declare(value) {
            return {
                'background-image': 'linear-' + value
            }
        }
    } as RuleOptions,
    mixBlendMode: {
        match: /^blend:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    backdropFilter: {
        match: /^bd:./,
        layer: CoreLayer.Native,
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
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    fill: {
        match: /^fill:./,
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    strokeDasharray: {
        layer: CoreLayer.Native
    } as RuleOptions,
    strokeDashoffset: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    strokeWidth: {
        match: ['stroke(?:-width)?'],
        numeric: true,
        layer: CoreLayer.Native
    } as RuleOptions,
    stroke: {
        match: ['stroke'],
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    x: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    y: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    cx: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    cy: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    rx: {
        layer: CoreLayer.Native
    } as RuleOptions,
    ry: {
        layer: CoreLayer.Native
    } as RuleOptions,
    gridColumnStart: {
        match: /^grid-col-start:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    gridColumnEnd: {
        match: /^grid-col-end:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    gridColumn: {
        match: /^grid-col(?:umn)?(?:-span)?:./,
        layer: CoreLayer.NativeShorthand,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleOptions,
    gridColumns: {
        match: /^grid-cols:./,
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
        layer: CoreLayer.Normal
    } as RuleOptions,
    gridRowStart: {
        layer: CoreLayer.Native
    } as RuleOptions,
    gridRowEnd: {
        layer: CoreLayer.Native
    } as RuleOptions,
    gridRow: {
        match: /^grid-row-span:./,
        layer: CoreLayer.NativeShorthand,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleOptions,
    gridRows: {
        match: /^grid-rows:./,
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
        layer: CoreLayer.Normal
    } as RuleOptions,
    gridAutoColumns: {
        match: /^grid-auto-cols:./,
        layer: CoreLayer.Native,
        variables: {
            min: 'min-content',
            max: 'max-content'
        }
    } as RuleOptions,
    gridAutoFlow: {
        match: /^grid-flow:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    gridAutoRows: {
        variables: {
            min: 'min-content',
            max: 'max-content'
        },
        layer: CoreLayer.Native
    } as RuleOptions,
    gridTemplateAreas: {
        layer: CoreLayer.Native
    } as RuleOptions,
    gridTemplateColumns: {
        match: /^grid-template-cols:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: {
            min: 'min-content',
            max: 'max-content'
        }
    } as RuleOptions,
    gridTemplateRows: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: {
            min: 'min-content',
            max: 'max-content'
        }
    } as RuleOptions,
    gridTemplate: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    gridArea: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    grid: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    columnGap: {
        match: /^gap-x:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    rowGap: {
        match: /^gap-y:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    gap: {
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as RuleOptions,
    order: {
        match: /^o:./,
        layer: CoreLayer.Native,
        variables: {
            first: -999999,
            last: 999999
        }
    } as RuleOptions,
    breakInside: {
        layer: CoreLayer.Native
    } as RuleOptions,
    breakBefore: {
        layer: CoreLayer.Native
    } as RuleOptions,
    breakAfter: {
        layer: CoreLayer.Native
    } as RuleOptions,
    aspectRatio: {
        match: /^aspect:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    columnSpan: {
        match: /^col-span:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    alignContent: {
        match: /^ac:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    alignItems: {
        match: /^ai:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    alignSelf: {
        match: /^as:/,
        layer: CoreLayer.Native
    } as RuleOptions,
    justifyContent: {
        match: /^jc:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    justifyItems: {
        match: /^ji:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    justifySelf: {
        match: /^js:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    placeContent: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    placeItems: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    placeSelf: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    listStylePosition: {
        match: ['list-style', ['inside', 'outside']],
        layer: CoreLayer.Native
    } as RuleOptions,
    listStyleType: {
        match: ['list-style', ['disc', 'decimal']],
        layer: CoreLayer.Native
    } as RuleOptions,
    listStyleImage: {
        match: ['list-style', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: CoreLayer.Native
    } as RuleOptions,
    listStyle: {
        layer: CoreLayer.NativeShorthand
    } as RuleOptions,
    outlineColor: {
        match: ['outline'],
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    outlineOffset: {
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    outlineStyle: {
        match: ['outline', ['dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native
    } as RuleOptions,
    outlineWidth: {
        match: ['outline', ['medium', 'thick', 'thin']],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native
    } as RuleOptions,
    outline: {
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        colored: true,
        transform(value) {
            if (!/hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        },
        variables: [
            'outlineWidth',
            'outlineStyle',
            'outlineOffset',
            'outlineColor'
        ]
    } as RuleOptions,
    accentColor: {
        match: /^accent:./,
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    appearance: {
        layer: CoreLayer.Native
    } as RuleOptions,
    caretColor: {
        match: /^caret:./,
        layer: CoreLayer.Native,
        colored: true
    } as RuleOptions,
    scrollBehavior: {
        layer: CoreLayer.Native
    } as RuleOptions,
    // scroll margin
    scrollMarginLeft: {
        match: /^scroll-ml:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    scrollMarginRight: {
        match: /^scroll-mr:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    scrollMarginTop: {
        match: /^scroll-mt:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    scrollMarginBottom: {
        match: /^scroll-mb:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    scrollMarginX: {
        match: /^(?:scroll-margin-x|scroll-mx):./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'scroll-margin-left': value + unit,
                'scroll-margin-right': value + unit
            }
        },
        variables: ['spacing']
    } as RuleOptions,
    scrollMarginY: {
        match: /^(?:scroll-margin-y|scroll-my):./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'scroll-margin-top': value + unit,
                'scroll-margin-bottom': value + unit
            }
        },
        variables: ['spacing']
    } as RuleOptions,
    scrollMargin: {
        match: /^scroll-m:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as RuleOptions,
    // scroll padding
    scrollPaddingLeft: {
        match: /^scroll-pl:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    scrollPaddingRight: {
        match: /^scroll-pr:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    scrollPaddingTop: {
        match: /^scroll-pt:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    scrollPaddingBottom: {
        match: /^scroll-pb:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as RuleOptions,
    scrollPaddingX: {
        match: /^(?:scroll-padding-x|scroll-px):./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'scroll-padding-left': value + unit,
                'scroll-padding-right': value + unit
            }
        },
        variables: ['spacing']
    } as RuleOptions,
    scrollPaddingY: {
        match: /^(?:scroll-padding-y|scroll-py):./,
        unit: 'rem',
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'scroll-padding-top': value + unit,
                'scroll-padding-bottom': value + unit
            }
        },
        variables: ['spacing']
    } as RuleOptions,
    scrollPadding: {
        match: /^scroll-p:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as RuleOptions,
    // scroll snap
    scrollSnapAlign: {
        match: ['scroll-snap', ['start', 'end', 'center']],
        layer: CoreLayer.Native
    } as RuleOptions,
    scrollSnapStop: {
        match: ['scroll-snap', ['normal', 'always']],
        layer: CoreLayer.Native
    } as RuleOptions,
    scrollSnapType: {
        match: ['scroll-snap', ['x', 'y', 'block', 'inline', 'both']],
        layer: CoreLayer.Native
    } as RuleOptions,
    willChange: {
        layer: CoreLayer.Native
    } as RuleOptions,
    writingMode: {
        match: /^writing:./,
        layer: CoreLayer.Native
    } as RuleOptions,
    direction: {
        layer: CoreLayer.Native
    } as RuleOptions,
    shapeOutside: {
        match: ['shape', ['(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)']],
        layer: CoreLayer.Native,
        variables: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box',
            margin: 'margin-box'
        }
    } as RuleOptions,
    shapeMargin: {
        match: ['shape'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as RuleOptions,
    shapeImageThreshold: {
        layer: CoreLayer.Native
    } as RuleOptions,
    clipPath: {
        match: /^clip:./,
        layer: CoreLayer.Native,
        variables: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box',
            margin: 'margin-box',
            fill: 'fill-box',
            stroke: 'stroke-box',
            view: 'view-box'
        }
    } as RuleOptions,
    quotes: {
        layer: CoreLayer.Native
    } as RuleOptions,
    maskImage: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                'mask-image': value + unit,
                '-webkit-mask-image': value + unit
            }
        }
    } as RuleOptions
}

export default rules
