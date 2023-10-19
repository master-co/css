import cssEscape from 'shared/utils/css-escape'
import { START_SYMBOLS } from '../constants/start-symbol'
import type { Rule } from '../rule'
import { CSSDeclarations } from '../types/css-declarations'
import { CoreLayer } from '../layer'

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
    } as Rule['options'],
    variable: {
        match: /^\$[\w-]+:./, // don't use 'rem' as default, because css variable is common API
        colored: true,
        layer: CoreLayer.Normal,
        declare(value) {
            return {
                ['--' + this.prefix.slice(1, -1)]: value
            }
        }
    } as Rule['options'],
    fontSize: {
        match: ['f(?:ont)?'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
    fontWeight: {
        match: ['f(?:ont)?', ['bolder']],
        layer: CoreLayer.Native
    } as Rule['options'],
    fontFamily: {
        match: ['f(?:ont)?'],
        layer: CoreLayer.Native
    } as Rule['options'],
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
    } as Rule['options'],
    fontStyle: {
        match: ['f(?:ont)?', ['normal', 'italic', 'oblique']],
        layer: CoreLayer.Native,
        unit: 'deg'
    } as Rule['options'],
    fontVariantNumeric: {
        match: ['f(?:ont)?', ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions']],
        layer: CoreLayer.Native
    } as Rule['options'],
    fontVariant: {
        layer: CoreLayer.NativeShorthand
    },
    fontFeatureSettings: {
        match: /^font-feature:./,
        layer: CoreLayer.Native
    } as Rule['options'],
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
    } as Rule['options'],
    color: {
        match: /^(?:color|fg|foreground):./,
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    // margin
    marginLeft: {
        match: /^ml:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    marginRight: {
        match: /^mr:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    marginTop: {
        match: /^mt:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    marginBottom: {
        match: /^mb:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
    margin: {
        match: /^m:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as Rule['options'],
    // margin inline
    marginInlineStart: {
        match: /^mis:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    marginInlineEnd: {
        match: /^mie:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    marginInline: {
        match: /^mi:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as Rule['options'],
    // padding
    paddingLeft: {
        match: /^pl:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    paddingRight: {
        match: /^pr:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    paddingTop: {
        match: /^pt:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    paddingBottom: {
        match: /^pb:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
    padding: {
        match: /^p:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as Rule['options'],
    // padding inline
    paddingInlineStart: {
        match: /^pis:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    paddingInlineEnd: {
        match: /^pie:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    paddingInline: {
        match: /^pi:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as Rule['options'],
    // flex
    flexBasis: {
        variables: [
            {
                full: '100%',
                fit: 'fit-content',
                max: 'max-content',
                min: 'min-content'
            },
            'section'
        ],
        unit: 'rem',
        layer: CoreLayer.Native,
    } as Rule['options'],
    flexWrap: {
        match: ['flex', ['wrap', 'nowrap', 'wrap-reverse']],
        layer: CoreLayer.Native
    } as Rule['options'],
    flexGrow: {
        layer: CoreLayer.Native
    } as Rule['options'],
    flexShrink: {
        layer: CoreLayer.Native
    } as Rule['options'],
    flexDirection: {
        match: ['flex', ['row', 'row-reverse', 'column', 'column-reverse']],
        layer: CoreLayer.Native,
        variables: {
            col: 'column',
            'col-reverse': 'column-reverse'
        }
    } as Rule['options'],
    flex: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    display: {
        match: /^d:./,
        layer: CoreLayer.Native,
    } as Rule['options'],
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
            'section'
        ]
    } as Rule['options'],
    height: {
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
            'section'
        ]
    } as Rule['options'],
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
            'section'
        ]
    } as Rule['options'],
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
            'section'
        ]
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
    boxSizing: {
        match: /^box:./,
        layer: CoreLayer.Native,
        variables: {
            content: 'content-box',
            border: 'border-box',
        }
    } as Rule['options'],
    boxDecorationBreak: {
        match: ['section', ['slice', 'clone']],
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                'box-decoration-break': value + unit,
                '-webkit-box-decoration-break': value + unit
            }
        }
    } as Rule['options'],
    contain: {
        layer: CoreLayer.Native
    } as Rule['options'],
    content: {
        layer: CoreLayer.Native
    } as Rule['options'],
    counterIncrement: {
        layer: CoreLayer.Native
    } as Rule['options'],
    counterReset: {
        layer: CoreLayer.Native,
    } as Rule['options'],
    letterSpacing: {
        match: /^ls:./,
        layer: CoreLayer.Native,
        unit: 'em'
    } as Rule['options'],
    lineHeight: {
        match: /^lh:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    objectFit: {
        match: ['(?:object|obj)', ['contain', 'cover', 'fill', 'scale-down']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    objectPosition: {
        match: ['(?:object|obj)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    textAlign: {
        match: ['t(?:ext)?', ['justify', 'center', 'left', 'right', 'start', 'end']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    textDecorationColor: {
        match: ['text-decoration'],
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    textDecorationStyle: {
        match: ['t(?:ext)?', ['solid', 'double', 'dotted', 'dashed', 'wavy']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    textDecorationThickness: {
        match: ['text-decoration', ['from-font']],
        numeric: true,
        layer: CoreLayer.Native,
        unit: 'em'
    } as Rule['options'],
    textDecorationLine: {
        match: ['t(?:ext)?', ['none', 'underline', 'overline', 'line-through']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    textDecoration: {
        match: ['t(?:ext)?', ['underline', 'overline', 'line-through']],
        unit: 'rem',
        colored: true,
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    textUnderlineOffset: {
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    textOverflow: {
        match: ['t(?:ext)?', ['ellipsis', 'clip']],
        layer: CoreLayer.Native
    } as Rule['options'],
    textOrientation: {
        match: ['t(?:ext)?', ['mixed', 'upright', 'sideways-right', 'sideways', 'use-glyph-orientation']],
        layer: CoreLayer.Native
    } as Rule['options'],
    textTransform: {
        match: ['t(?:ext)?', ['uppercase', 'lowercase', 'capitalize']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    textRendering: {
        match: ['t(?:ext)?', ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    textIndent: {
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
    verticalAlign: {
        match: /^(?:v|vertical):./,
        layer: CoreLayer.Native
    } as Rule['options'],
    columns: {
        match: /^(?:columns|cols):./,
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    whiteSpace: {
        layer: CoreLayer.Native
    } as Rule['options'],
    top: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    bottom: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    left: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    right: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    inset: {
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as Rule['options'],
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
    } as Rule['options'],
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
            'section'
        ]
    } as Rule['options'],
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
            'section'
        ]
    } as Rule['options'],
    opacity: {
        layer: CoreLayer.Native,
    } as Rule['options'],
    visibility: {
        layer: CoreLayer.Native
    } as Rule['options'],
    clear: {
        layer: CoreLayer.Native,
    } as Rule['options'],
    float: {
        layer: CoreLayer.Native
    } as Rule['options'],
    isolation: {
        layer: CoreLayer.Native
    } as Rule['options'],
    overflowX: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-x': ['auto', value] }
                : { 'overflow-x': value }
        }
    } as Rule['options'],
    overflowY: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-y': ['auto', value] }
                : { 'overflow-y': value }
        }
    } as Rule['options'],
    overflow: {
        layer: CoreLayer.NativeShorthand,
        declare(value, unit) {
            return value === 'overlay'
                ? { overflow: ['auto', value] }
                : { overflow: value }
        }
    } as Rule['options'],
    overscrollBehaviorX: {
        layer: CoreLayer.Native
    } as Rule['options'],
    overscrollBehaviorY: {
        layer: CoreLayer.Native
    } as Rule['options'],
    overscrollBehavior: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    zIndex: {
        match: /^z:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    position: {
        layer: CoreLayer.Native,
        variables: {
            abs: 'absolute',
            rel: 'relative'
        }
    } as Rule['options'],
    cursor: {
        layer: CoreLayer.Native
    } as Rule['options'],
    pointerEvents: {
        layer: CoreLayer.Native
    } as Rule['options'],
    resize: {
        layer: CoreLayer.Native
    } as Rule['options'],
    touchAction: {
        layer: CoreLayer.Native
    } as Rule['options'],
    wordBreak: {
        layer: CoreLayer.Native
    } as Rule['options'],
    wordSpacing: {
        layer: CoreLayer.Native,
        unit: 'em'
    } as Rule['options'],
    userDrag: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                'user-drag': value + unit,
                '-webkit-user-drag': value + unit
            }
        }
    } as Rule['options'],
    userSelect: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                'user-select': value + unit,
                '-webkit-user-select': value + unit
            }
        }
    } as Rule['options'],
    textShadow: {
        unit: 'rem',
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
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
    } as Rule['options'],
    textFillColor: {
        match: ['(?:text-fill|text|t)'],
        layer: CoreLayer.Native,
        colored: true,
        declare(value, unit) {
            return {
                '-webkit-text-fill-color': value + unit
            }
        }
    } as Rule['options'],
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
    } as Rule['options'],
    textStrokeColor: {
        match: ['text-stroke'],
        layer: CoreLayer.Native,
        colored: true,
        declare(value, unit) {
            return {
                '-webkit-text-stroke-color': value + unit
            }
        }
    } as Rule['options'],
    textStroke: {
        unit: 'rem',
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                '-webkit-text-stroke': value + unit
            }
        }
    } as Rule['options'],
    boxShadow: {
        match: /^s(?:hadow)?:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    tableLayout: {
        layer: CoreLayer.Native
    } as Rule['options'],
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
    } as Rule['options'],
    transformStyle: {
        match: ['transform', ['flat', 'preserve-3d']],
        layer: CoreLayer.Native
    } as Rule['options'],
    transformOrigin: {
        match: ['transform', ['top', 'bottom', 'right', 'left', 'center']],
        numeric: true,
        unit: 'px',
        layer: CoreLayer.Native
    } as Rule['options'],
    transform: {
        match: /^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\(/,
        layer: CoreLayer.Native,
        analyze(className: string) {
            return [className.startsWith('transform') ? className.slice(10) : className]
        },
        variables: ['spacing']
    } as Rule['options'],
    transitionProperty: {
        match: /^~property:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    transitionTimingFunction: {
        match: /^~easing:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    transitionDuration: {
        match: /^~duration:./,
        layer: CoreLayer.Native,
        unit: 'ms'
    } as Rule['options'],
    transitionDelay: {
        match: /^~delay:./,
        layer: CoreLayer.Native,
        unit: 'ms'
    } as Rule['options'],
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
    } as Rule['options'],
    animationDelay: {
        match: /^@delay:./,
        layer: CoreLayer.Native,
        unit: 'ms'
    } as Rule['options'],
    animationDirection: {
        match: /^@direction:./,
        layer: CoreLayer.Native,
        variables: {
            alt: 'alternate',
            'alt-reverse': 'alternate-reverse'
        }
    } as Rule['options'],
    animationDuration: {
        match: /^@duration:./,
        layer: CoreLayer.Native,
        unit: 'ms'
    } as Rule['options'],
    animationFillMode: {
        match: /^@fill:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    animationIterationCount: {
        match: /^@iteration:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    animationName: {
        match: /^@name:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    animationPlayState: {
        match: /^@play:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    animationTimingFunction: {
        match: /^@easing:./,
        layer: CoreLayer.Native
    } as Rule['options'],
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
    } as Rule['options'],
    borderCollapse: {
        match: ['b(?:order)?', ['collapse', 'separate']],
        layer: CoreLayer.Native
    } as Rule['options'],
    borderSpacing: {
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
    // border color
    borderTopColor: {
        match: ['b(?:t|order-top(?:-color)?)'],
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    borderBottomColor: {
        match: ['b(?:b|order-bottom(?:-color)?)'],
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    borderLeftColor: {
        match: ['b(?:l|order-left(?:-color)?)'],
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    borderRightColor: {
        match: ['b(?:r|order-right(?:-color)?)'],
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
    borderColor: {
        match: ['b(?:order)?(?:-color)?'],
        layer: CoreLayer.NativeShorthand,
        colored: true
    } as Rule['options'],
    // border radius
    borderTopLeftRadius: {
        match: /^r(?:tl|lt):./,
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
    borderTopRightRadius: {
        match: /^r(?:tr|rt):./,
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
    borderBottomLeftRadius: {
        match: /^r(?:bl|lb):./,
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
    borderBottomRightRadius: {
        match: /^r(?:br|rb):./,
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
    borderRadius: {
        match: /^r:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    // border style
    borderTopStyle: {
        match: ['b(?:t|order-top(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    borderBottomStyle: {
        match: ['b(?:b|order-bottom(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    borderLeftStyle: {
        match: ['b(?:l|order-left(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    borderRightStyle: {
        match: ['b(?:r|order-right(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native,
    } as Rule['options'],
    borderXStyle: {
        match: ['b(?:x|order-x(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'border-left-style': value + unit,
                'border-right-style': value + unit
            }
        }
    } as Rule['options'],
    borderYStyle: {
        match: ['b(?:y|order-y(?:-style)?)', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Shorthand,
        declare(value, unit) {
            return {
                'border-top-style': value + unit,
                'border-bottom-style': value + unit
            }
        }
    } as Rule['options'],
    borderStyle: {
        match: ['b(?:order)?(?:-style)?', ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    // border width
    borderTopWidth: {
        match: ['b(?:t|order-top(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
    } as Rule['options'],
    borderBottomWidth: {
        match: ['b(?:b|order-bottom(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
    } as Rule['options'],
    borderLeftWidth: {
        match: ['b(?:l|order-left(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
    } as Rule['options'],
    borderRightWidth: {
        match: ['b(?:r|order-right(?:-width)?)'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
    borderWidth: {
        match: ['b(?:order)?(?:-width)?'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    // border image
    borderImageOutset: {
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
    borderImageRepeat: {
        match: ['border-image', ['stretch', 'repeat', 'round', 'space']],
        layer: CoreLayer.Native
    } as Rule['options'],
    borderImageSlice: {
        layer: CoreLayer.Native
    } as Rule['options'],
    borderImageSource: {
        match: ['border-image', ['url', 'linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient']],
        layer: CoreLayer.Native
    } as Rule['options'],
    borderImageWidth: {
        match: ['border-image', ['auto']],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
    borderImage: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
    backgroundAttachment: {
        match: ['(?:bg|background)', ['fixed', 'local', 'scroll']],
        layer: CoreLayer.Native
    } as Rule['options'],
    backgroundBlendMode: {
        layer: CoreLayer.Native
    } as Rule['options'],
    backgroundColor: {
        match: ['(?:bg|background)'],
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
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
    } as Rule['options'],
    backgroundOrigin: {
        match: ['(?:bg|background)'],
        layer: CoreLayer.Native,
        variables: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box'
        }
    } as Rule['options'],
    backgroundPosition: {
        match: ['(?:bg|background)', ['top', 'bottom', 'right', 'left', 'center']],
        layer: CoreLayer.Native,
        unit: 'px'
    } as Rule['options'],
    backgroundRepeat: {
        match: ['(?:bg|background)', ['space', 'round', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y']],
        layer: CoreLayer.Native
    } as Rule['options'],
    backgroundSize: {
        match: ['(?:bg|background)', ['auto', 'cover', 'contain']],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
    backgroundImage: {
        match: ['(?:bg|background)', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: CoreLayer.Native
    } as Rule['options'],
    background: {
        match: /^bg:./,
        colored: true,
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    gradient: {
        match: /^gradient\(/,
        layer: CoreLayer.Native,
        colored: true,
        declare(value) {
            return {
                'background-image': 'linear-' + value
            }
        }
    } as Rule['options'],
    mixBlendMode: {
        match: /^blend:./,
        layer: CoreLayer.Native
    } as Rule['options'],
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
    } as Rule['options'],
    filter: {
        match: /^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(/,
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    fill: {
        match: /^fill:./,
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    strokeDasharray: {
        layer: CoreLayer.Native
    } as Rule['options'],
    strokeDashoffset: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    strokeWidth: {
        match: ['stroke(?:-width)?'],
        numeric: true,
        layer: CoreLayer.Native
    } as Rule['options'],
    stroke: {
        match: ['stroke'],
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    x: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    y: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    cx: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    cy: {
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    rx: {
        layer: CoreLayer.Native
    } as Rule['options'],
    ry: {
        layer: CoreLayer.Native
    } as Rule['options'],
    gridColumnStart: {
        match: /^grid-col-start:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    gridColumnEnd: {
        match: /^grid-col-end:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    gridColumn: {
        match: /^grid-col(?:umn)?(?:-span)?:./,
        layer: CoreLayer.NativeShorthand,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as Rule['options'],
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
    } as Rule['options'],
    gridRowStart: {
        layer: CoreLayer.Native
    } as Rule['options'],
    gridRowEnd: {
        layer: CoreLayer.Native
    } as Rule['options'],
    gridRow: {
        match: /^grid-row-span:./,
        layer: CoreLayer.NativeShorthand,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as Rule['options'],
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
    } as Rule['options'],
    gridAutoColumns: {
        match: /^grid-auto-cols:./,
        layer: CoreLayer.Native,
        variables: {
            min: 'min-content',
            max: 'max-content'
        }
    } as Rule['options'],
    gridAutoFlow: {
        match: /^grid-flow:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    gridAutoRows: {
        variables: {
            min: 'min-content',
            max: 'max-content'
        },
        layer: CoreLayer.Native
    } as Rule['options'],
    gridTemplateAreas: {
        layer: CoreLayer.Native
    } as Rule['options'],
    gridTemplateColumns: {
        match: /^grid-template-cols:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: {
            min: 'min-content',
            max: 'max-content'
        }
    } as Rule['options'],
    gridTemplateRows: {
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: {
            min: 'min-content',
            max: 'max-content'
        }
    } as Rule['options'],
    gridTemplate: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    gridArea: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    grid: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    columnGap: {
        match: /^gap-x:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    rowGap: {
        match: /^gap-y:./,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    gap: {
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as Rule['options'],
    order: {
        match: /^o:./,
        layer: CoreLayer.Native,
        variables: {
            first: -999999,
            last: 999999
        }
    } as Rule['options'],
    breakInside: {
        layer: CoreLayer.Native
    } as Rule['options'],
    breakBefore: {
        layer: CoreLayer.Native
    } as Rule['options'],
    breakAfter: {
        layer: CoreLayer.Native
    } as Rule['options'],
    aspectRatio: {
        match: /^aspect:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    columnSpan: {
        match: /^col-span:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    alignContent: {
        match: /^ac:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    alignItems: {
        match: /^ai:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    alignSelf: {
        match: /^as:/,
        layer: CoreLayer.Native
    } as Rule['options'],
    justifyContent: {
        match: /^jc:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    justifyItems: {
        match: /^ji:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    justifySelf: {
        match: /^js:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    placeContent: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    placeItems: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    placeSelf: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    listStylePosition: {
        match: ['list-style', ['inside', 'outside']],
        layer: CoreLayer.Native
    } as Rule['options'],
    listStyleType: {
        match: ['list-style', ['disc', 'decimal']],
        layer: CoreLayer.Native
    } as Rule['options'],
    listStyleImage: {
        match: ['list-style', ['(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)']],
        layer: CoreLayer.Native
    } as Rule['options'],
    listStyle: {
        layer: CoreLayer.NativeShorthand
    } as Rule['options'],
    outlineColor: {
        match: ['outline'],
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    outlineOffset: {
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    outlineStyle: {
        match: ['outline', ['dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        layer: CoreLayer.Native
    } as Rule['options'],
    outlineWidth: {
        match: ['outline', ['medium', 'thick', 'thin']],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native
    } as Rule['options'],
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
    } as Rule['options'],
    accentColor: {
        match: /^accent:./,
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    appearance: {
        layer: CoreLayer.Native
    } as Rule['options'],
    caretColor: {
        match: /^caret:./,
        layer: CoreLayer.Native,
        colored: true
    } as Rule['options'],
    scrollBehavior: {
        layer: CoreLayer.Native
    } as Rule['options'],
    // scroll margin
    scrollMarginLeft: {
        match: /^scroll-ml:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    scrollMarginRight: {
        match: /^scroll-mr:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    scrollMarginTop: {
        match: /^scroll-mt:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    scrollMarginBottom: {
        match: /^scroll-mb:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
    scrollMargin: {
        match: /^scroll-m:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as Rule['options'],
    // scroll padding
    scrollPaddingLeft: {
        match: /^scroll-pl:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    scrollPaddingRight: {
        match: /^scroll-pr:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    scrollPaddingTop: {
        match: /^scroll-pt:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
    scrollPaddingBottom: {
        match: /^scroll-pb:./,
        layer: CoreLayer.Native,
        unit: 'rem',
        variables: ['spacing']
    } as Rule['options'],
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
    } as Rule['options'],
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
    } as Rule['options'],
    scrollPadding: {
        match: /^scroll-p:./,
        unit: 'rem',
        layer: CoreLayer.NativeShorthand,
        variables: ['spacing']
    } as Rule['options'],
    // scroll snap
    scrollSnapAlign: {
        match: ['scroll-snap', ['start', 'end', 'center']],
        layer: CoreLayer.Native
    } as Rule['options'],
    scrollSnapStop: {
        match: ['scroll-snap', ['normal', 'always']],
        layer: CoreLayer.Native
    } as Rule['options'],
    scrollSnapType: {
        match: ['scroll-snap', ['x', 'y', 'block', 'inline', 'both']],
        layer: CoreLayer.Native
    } as Rule['options'],
    willChange: {
        layer: CoreLayer.Native
    } as Rule['options'],
    writingMode: {
        match: /^writing:./,
        layer: CoreLayer.Native
    } as Rule['options'],
    direction: {
        layer: CoreLayer.Native
    } as Rule['options'],
    shapeOutside: {
        match: ['shape', ['(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)']],
        layer: CoreLayer.Native,
        variables: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box',
            margin: 'margin-box'
        }
    } as Rule['options'],
    shapeMargin: {
        match: ['shape'],
        numeric: true,
        unit: 'rem',
        layer: CoreLayer.Native,
        variables: ['spacing']
    } as Rule['options'],
    shapeImageThreshold: {
        layer: CoreLayer.Native
    } as Rule['options'],
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
    } as Rule['options'],
    quotes: {
        layer: CoreLayer.Native
    } as Rule['options'],
    maskImage: {
        layer: CoreLayer.Native,
        declare(value, unit) {
            return {
                'mask-image': value + unit,
                '-webkit-mask-image': value + unit
            }
        }
    } as Rule['options']
}

export default rules