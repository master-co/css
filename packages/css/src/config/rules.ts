import { START_SYMBOL } from '../constants/start-symbol'
import { Declarations, Rule, RuleConfig, RuleNative } from '../rule'

// TODO 於 index.node.ts 引入且防止被樹搖，目前被視為無副作用並被清除
import { cssEscape } from '../utils/css-escape'

type RuleKey = 'group'
| 'variable'
| 'fontSize'
| 'fontWeight'
| 'fontFamily'
| 'fontSmoothing'
| 'fontStyle'
| 'fontVariantNumeric'
| 'fontFeatureSettings'
| 'font'
| 'color'
| 'marginLeft'
| 'marginRight'
| 'marginTop'
| 'marginBottom'
| 'marginX'
| 'marginY'
| 'margin'
| 'paddingLeft'
| 'paddingRight'
| 'paddingTop'
| 'paddingBottom'
| 'paddingX'
| 'paddingY'
| 'padding'
| 'flexBasis'
| 'flexWrap'
| 'flexGrow'
| 'flexShrink'
| 'flexDirection'
| 'flex'
| 'display'
| 'width'
| 'height'
| 'minWidth'
| 'minHeight'
| 'box'
| 'minBox'
| 'maxBox'
| 'contain'
| 'content'
| 'counterIncrement'
| 'counterReset'
| 'letterSpacing'
| 'lineHeight'
| 'objectFit'
| 'objectPosition'
| 'textAlign'
| 'textDecorationColor'
| 'textDecorationStyle'
| 'textDecorationThickness'
| 'textDecorationLine'
| 'textDecoration'
| 'textUnderlineOffset'
| 'textOverflow'
| 'textOrientation'
| 'textTransform'
| 'textRendering'
| 'textIndent'
| 'verticalAlign'
| 'columns'
| 'whiteSpace'
| 'top'
| 'bottom'
| 'left'
| 'right'
| 'inset'
| 'lines'
| 'maxHeight'
| 'maxWidth'
| 'boxSizing'
| 'opacity'
| 'visibility'
| 'clear'
| 'float'
| 'isolation'
| 'overflowX'
| 'overflowY'
| 'overflow'
| 'overscrollBehaviorX'
| 'overscrollBehaviorY'
| 'overscrollBehavior'
| 'zIndex'
| 'position'
| 'cursor'
| 'pointerEvents'
| 'resize'
| 'touchAction'
| 'wordBreak'
| 'wordSpacing'
| 'userDrag'
| 'userSelect'
| 'textShadow'
| 'textSize'
| 'textFillColor'
| 'textStrokeWidth'
| 'textStrokeColor'
| 'textStroke'
| 'boxShadow'
| 'tableLayout'
| 'transformBox'
| 'transformStyle'
| 'transformOrigin'
| 'transform'
| 'transitionProperty'
| 'transitionTimingFunction'
| 'transitionDuration'
| 'transitionDelay'
| 'transition'
| 'animationDelay'
| 'animationDirection'
| 'animationDuration'
| 'animationFillMode'
| 'animationIterationCount'
| 'animationName'
| 'animationPlayState'
| 'animationTimingFunction'
| 'animation'
| 'borderCollapse'
| 'borderSpacing'
| 'borderTopColor'
| 'borderBottomColor'
| 'borderLeftColor'
| 'borderRightColor'
| 'borderXColor'
| 'borderYColor'
| 'borderColor'
| 'borderTopLeftRadius'
| 'borderTopRightRadius'
| 'borderBottomLeftRadius'
| 'borderBottomRightRadius'
| 'borderTopRadius'
| 'borderBottomRadius'
| 'borderLeftRadius'
| 'borderRightRadius'
| 'borderRadius'
| 'borderTopStyle'
| 'borderBottomStyle'
| 'borderLeftStyle'
| 'borderRightStyle'
| 'borderXStyle'
| 'borderYStyle'
| 'borderStyle'
| 'borderTopWidth'
| 'borderBottomWidth'
| 'borderLeftWidth'
| 'borderRightWidth'
| 'borderXWidth'
| 'borderYWidth'
| 'borderWidth'
| 'borderImageOutset'
| 'borderImageRepeat'
| 'borderImageSlice'
| 'borderImageSource'
| 'borderImageWidth'
| 'borderImage'
| 'borderTop'
| 'borderBottom'
| 'borderLeft'
| 'borderRight'
| 'borderX'
| 'borderY'
| 'border'
| 'backgroundAttachment'
| 'backgroundBlendMode'
| 'backgroundColor'
| 'backgroundClip'
| 'backgroundOrigin'
| 'backgroundPosition'
| 'backgroundRepeat'
| 'backgroundSize'
| 'backgroundImage'
| 'background'
| 'mixBlendMode'
| 'backdropFilter'
| 'filter'
| 'fill'
| 'strokeDasharray'
| 'strokeDashoffset'
| 'strokeWidth'
| 'stroke'
| 'x'
| 'y'
| 'cx'
| 'cy'
| 'rx'
| 'ry'
| 'gridColumnStart'
| 'gridColumnEnd'
| 'gridColumn'
| 'gridColumns'
| 'gridRowStart'
| 'gridRowEnd'
| 'gridRow'
| 'gridRows'
| 'gridAutoColumns'
| 'gridAutoFlow'
| 'gridAutoRows'
| 'gridTemplateAreas'
| 'gridTemplateColumns'
| 'gridTemplateRows'
| 'gridTemplate'
| 'gridArea'
| 'grid'
| 'gapX'
| 'gapY'
| 'gap'
| 'order'
| 'breakInside'
| 'breakBefore'
| 'breakAfter'
| 'boxDecorationBreak'
| 'aspectRatio'
| 'columnSpan'
| 'alignContent'
| 'alignItems'
| 'alignSelf'
| 'justifyContent'
| 'justifyItems'
| 'justifySelf'
| 'placeContent'
| 'placeItems'
| 'placeSelf'
| 'listStylePosition'
| 'listStyleType'
| 'listStyleImage'
| 'listStyle'
| 'outlineColor'
| 'outlineOffset'
| 'outlineStyle'
| 'outlineWidth'
| 'outline'
| 'accentColor'
| 'appearance'
| 'caretColor'
| 'scrollBehavior'
| 'scrollMarginLeft'
| 'scrollMarginRight'
| 'scrollMarginTop'
| 'scrollMarginBottom'
| 'scrollMarginX'
| 'scrollMarginY'
| 'scrollMargin'
| 'scrollPaddingLeft'
| 'scrollPaddingRight'
| 'scrollPaddingTop'
| 'scrollPaddingBottom'
| 'scrollPaddingX'
| 'scrollPaddingY'
| 'scrollPadding'
| 'scrollSnapAlign'
| 'scrollSnapStop'
| 'scrollSnapType'
| 'willChange'
| 'writingMode'
| 'direction'
| 'shapeOutside'
| 'shapeMargin'
| 'shapeImageThreshold'
| 'clipPath'
| 'quotes'
| 'maskImage'

const defaultRules: Record<RuleKey, RuleConfig> = {
    group: {
        match: '^(?:.+?[*_>~+])?\\{.+?\\}',
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
            }

            const names = []
            let currentName = ''
            const addName = () => {
                if (currentName) {
                    names.push(currentName.replace(/ /g, ''))
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
                    } else if (char in START_SYMBOL && (end !== '\'' && end !== '"')) {
                        i++
                        analyze(START_SYMBOL[char])
                    }
                }
            })(undefined)
            addName()

            for (const eachName of names) {
                const result = this.css.create(eachName)
                if (Array.isArray(result)) {
                    for (const eachRule of result) {
                        handleRule(eachRule)
                    }
                } else {
                    if (result) {
                        handleRule(result)
                    } else {
                        addProp(this.theme ?? '', eachName)
                    }
                }
            }

            const declarations: Declarations = {}
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
    },
    variable: {
        match: '^\\$[^ (){}A-Z]+:[^ ]', // don't use 'rem' as default, because css variable is common API
        declare(value) {
            return {
                ['--' + this.prefix.slice(1, -1)]: value
            }
        }
    },
    fontSize: {
        match: '^f(?:ont)?:(?:[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true
    },
    fontWeight: {
        match: '^f(?:ont)?:(?:bolder|$values)(?!\\|)',
        native: true,
        values: {
            thin: 100,
            extralight: 200,
            light: 300,
            regular: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
            heavy: 900
        }
    },
    fontFamily: {
        match: '^f(?:ont)?:(?:$values)(?!\\|)',
        native: true,
        values: {
            mono: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
            sans: 'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
            serif: 'ui-serif,Georgia,Cambria,Times New Roman,Times,serif'
        }
    },
    fontSmoothing: {
        match: '^f(?:ont)?:(?:antialiased|subpixel-antialiased|$values)(?!\\|)',
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
    },
    fontStyle: {
        match: '^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)',
        native: true,
        unit: 'deg'
    },
    fontVariantNumeric: {
        match: '^f(?:ont)?:(?:ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions|$values)(?!\\|)',
        native: true
    },
    fontFeatureSettings: {
        match: '^font-feature:.',
        native: true
    },
    font: {
        match: '^f:.',
        native: true,
        order: -1
    },
    color: {
        match: '^(?:color|fg|foreground):.',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    marginLeft: {
        match: '^ml:.',
        native: true,
        unit: 'rem'
    },
    marginRight: {
        match: '^mr:.',
        native: true,
        unit: 'rem'
    },
    marginTop: {
        match: '^mt:.',
        native: true,
        unit: 'rem'
    },
    marginBottom: {
        match: '^mb:.',
        native: true,
        unit: 'rem'
    },
    marginX: {
        match: '^(?:mx|margin-x):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'margin-left': value + unit,
                'margin-right': value + unit
            }
        },
    },
    marginY: {
        match: '^(?:my|margin-y):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'margin-top': value + unit,
                'margin-bottom': value + unit
            }
        },
    },
    margin: {
        match: '^m:.',
        native: true,
        unit: 'rem',
        order: -1
    },
    paddingLeft: {
        match: '^pl:.',
        native: true,
        unit: 'rem'
    },
    paddingRight: {
        match: '^pr:.',
        native: true,
        unit: 'rem'
    },
    paddingTop: {
        match: '^pt:.',
        native: true,
        unit: 'rem'
    },
    paddingBottom: {
        match: '^pb:.',
        native: true,
        unit: 'rem'
    },
    paddingX: {
        match: '^(?:px|padding-x):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'padding-left': value + unit,
                'padding-right': value + unit
            }
        },
    },
    paddingY: {
        match: '^(?:py|padding-y):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'padding-top': value + unit,
                'padding-bottom': value + unit
            }
        },
    },
    padding: {
        match: '^p:.',
        native: true,
        unit: 'rem',
        order: -1
    },
    flexBasis: {
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '3xs': 360,
            '2xs': 480,
            xs: 600,
            sm: 768,
            md: 1024,
            lg: 1280,
            xl: 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        },
        unit: 'rem',
        native: true,
    },
    flexWrap: {
        match: '^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)',
        native: true
    },
    flexGrow: {
        native: true
    },
    flexShrink: {
        native: true
    },
    flexDirection: {
        match: '^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)',
        native: true,
        values: {
            col: 'column',
            'col-reverse': 'column-reverse'
        }
    },
    flex: {
        native: true,
        order: -1
    },
    display: {
        match: '^d:.',
        native: true,
    },
    width: {
        match: '^w:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '3xs': 360,
            '2xs': 480,
            xs: 600,
            sm: 768,
            md: 1024,
            lg: 1280,
            xl: 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    },
    height: {
        match: '^h:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '3xs': 360,
            '2xs': 480,
            xs: 600,
            sm: 768,
            md: 1024,
            lg: 1280,
            xl: 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    },
    minWidth: {
        match: '^min-w:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '3xs': 360,
            '2xs': 480,
            xs: 600,
            sm: 768,
            md: 1024,
            lg: 1280,
            xl: 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    },
    minHeight: {
        match: '^min-h:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '3xs': 360,
            '2xs': 480,
            xs: 600,
            sm: 768,
            md: 1024,
            lg: 1280,
            xl: 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    },
    box: {
        match: '^(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)',
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
    },
    minBox: {
        match: '^min:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)',
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
    },
    maxBox: {
        match: '^max:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)',
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
    },
    contain: {
        native: true
    },
    content: {
        native: true
    },
    counterIncrement: {
        native: true
    },
    counterReset: {
        native: true,
    },
    letterSpacing: {
        match: '^ls:.',
        native: true,
        unit: 'em'
    },
    lineHeight: {
        match: '^lh:.',
        native: true
    },
    objectFit: {
        match: '^(?:object|obj):(?:contain|cover|fill|scale-down|$values)',
        native: true,
    },
    objectPosition: {
        match: '^(?:object|obj):(?:top|bottom|right|left|center|$values)',
        native: true,
    },
    textAlign: {
        match: '^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)',
        native: true,
    },
    textDecorationColor: {
        match: '^text-decoration:(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    textDecorationStyle: {
        match: '^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)',
        native: true,
    },
    textDecorationThickness: {
        match: '^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$',
        native: true,
        unit: 'em'
    },
    textDecorationLine: {
        match: '^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)',
        native: true,
    },
    textDecoration: {
        match: '^t(?:ext)?:(?:underline|line-through|overline)',
        unit: 'rem',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
        order: -1
    },
    textUnderlineOffset: {
        unit: 'rem',
        native: true,
    },
    textOverflow: {
        match: '^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))',
        native: true
    },
    textOrientation: {
        match: '^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)',
        native: true
    },
    textTransform: {
        match: '^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)',
        native: true,
    },
    textRendering: {
        match: '^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)',
        native: true,
    },
    textIndent: {
        unit: 'rem',
        native: true
    },
    verticalAlign: {
        match: '^(?:v|vertical):.',
        native: true
    },
    columns: {
        match: '^(?:columns|cols):.',
        native: true,
        order: -1
    },
    whiteSpace: {
        native: true
    },
    top: {
        native: true,
        unit: 'rem'
    },
    bottom: {
        native: true,
        unit: 'rem'
    },
    left: {
        native: true,
        unit: 'rem'
    },
    right: {
        native: true,
        unit: 'rem'
    },
    inset: {
        native: true,
        unit: 'rem',
        order: -1
    },
    lines: {
        match: '^lines:.',
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
    },
    maxHeight: {
        match: '^max-h:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '3xs': 360,
            '2xs': 480,
            xs: 600,
            sm: 768,
            md: 1024,
            lg: 1280,
            xl: 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    },
    maxWidth: {
        match: '^max-w:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '3xs': 360,
            '2xs': 480,
            xs: 600,
            sm: 768,
            md: 1024,
            lg: 1280,
            xl: 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    },
    boxSizing: {
        match: '^box:(?:$values)(?!\\|)',
        native: true,
        values: {
            content: 'content-box',
            border: 'border-box',
        }
    },
    opacity: {
        native: true,
    },
    visibility: {
        native: true
    },
    clear: {
        native: true,
    },
    float: {
        native: true
    },
    isolation: {
        native: true
    },
    overflowX: {
        native: true
    },
    overflowY: {
        native: true
    },
    overflow: {
        native: true,
        order: -1
    },
    overscrollBehaviorX: {
        native: true
    },
    overscrollBehaviorY: {
        native: true
    },
    overscrollBehavior: {
        native: true,
        order: -1
    },
    zIndex: {
        match: '^z:.',
        native: true
    },
    position: {
        native: true,
        values: {
            abs: 'absolute',
            rel: 'relative'
        }
    },
    cursor: {
        native: true
    },
    pointerEvents: {
        native: true
    },
    resize: {
        native: true
    },
    touchAction: {
        native: true
    },
    wordBreak: {
        native: true
    },
    wordSpacing: {
        native: true,
        unit: 'em'
    },
    userDrag: {
        declare(value, unit) {
            return {
                'user-drag': value + unit,
                '-webkit-user-drag': value + unit
            }
        }
    },
    userSelect: {
        native: true,
        declare(value, unit) {
            return {
                'user-select': value + unit,
                '-webkit-user-select': value + unit
            }
        }
    },
    textShadow: {
        unit: 'rem',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    textSize: {
        match: '^t(?:ext)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
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
    },
    textFillColor: {
        native: true,
        match: '^(?:text-fill|text|t):(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))',
        colored: true,
        values: {
            current: 'currentColor'
        },
        declare(value, unit) {
            return {
                '-webkit-text-fill-color': value + unit
            }
        }
    },
    textStrokeWidth: {
        match: '^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)',
        unit: 'rem',
        declare(value, unit) {
            return {
                '-webkit-text-stroke-width': value + unit
            }
        }
    },
    textStrokeColor: {
        match: '^text-stroke:(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
        declare(value, unit) {
            return {
                '-webkit-text-stroke-color': value + unit
            }
        }
    },
    textStroke: {
        unit: 'rem',
        native: true,
        declare(value, unit) {
            return {
                '-webkit-text-stroke': value + unit
            }
        }
    },
    boxShadow: {
        match: '^s(?:hadow)?:.',
        unit: 'rem',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    tableLayout: {
        native: true
    },
    transformBox: {
        match: '^transform:(?:$values)(?!\\|)',
        native: true,
        values: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box',
            fill: 'fill-box',
            stroke: 'stroke-box',
            view: 'view-box'
        }
    },
    transformStyle: {
        match: '^transform:(?:flat|preserve-3d|$values)(?!\\|)',
        native: true
    },
    transformOrigin: {
        match: '^transform:(?:top|bottom|right|left|center|[0-9]|$values)',
        native: true,
        unit: 'px'
    },
    transform: {
        match: '^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\\(',
        native: true
    },
    transitionProperty: {
        match: '^~property:.',
        native: true
    },
    transitionTimingFunction: {
        match: '^~easing:.',
        native: true
    },
    transitionDuration: {
        match: '^~duration:.',
        native: true,
        unit: 'ms'
    },
    transitionDelay: {
        match: '^~delay:.',
        native: true,
        unit: 'ms'
    },
    transition: {
        symbol: '~',
        native: true,
        order: -1
    },
    animationDelay: {
        match: '^@delay:.',
        native: true,
        unit: 'ms'
    },
    animationDirection: {
        match: '^@direction:.',
        native: true
    },
    animationDuration: {
        match: '^@duration:.',
        native: true,
        unit: 'ms'
    },
    animationFillMode: {
        match: '^@fill-mode:.',
        native: true
    },
    animationIterationCount: {
        match: '^@iteration-count:.',
        native: true
    },
    animationName: {
        match: '^@name:.',
        native: true,
        create(className) {
            return animationCreate.call(this, className)
        },
        delete(className) {
            return animationDelete.call(this, className)
        },
        insert() {
            return animationInsert.call(this)
        }
    },
    animationPlayState: {
        match: '^@play-state:.',
        native: true
    },
    animationTimingFunction: {
        match: '^@easing:.',
        native: true
    },
    animation: {
        symbol: '@',
        native: true,
        order: -1,
        create(className) {
            return animationCreate.call(this, className)
        },
        delete(className) {
            return animationDelete.call(this, className)
        },
        insert() {
            return animationInsert.call(this)
        }
    },
    borderCollapse: {
        match: '^b(?:order)?:(?:collapse|separate|$values)(?!\\|)',
        native: true
    },
    borderSpacing: {
        unit: 'rem',
        native: true
    },
    // border color
    borderTopColor: {
        match: '^b(?:t|order-top(?:-color)?):(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
    },
    borderBottomColor: {
        match: '^b(?:b|order-bottom(?:-color)?):(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
    },
    borderLeftColor: {
        match: '^b(?:l|order-left(?:-color)?):(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
    },
    borderRightColor: {
        match: '^b(?:r|order-right(?:-color)?):(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
    },
    borderXColor: {
        match: '^b(?:x|order-x(?:-color)?):(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))[^|]*$',
        order: -.5,
        colored: true,
        values: {
            current: 'currentColor'
        },
        declare(value, unit) {
            return {
                'border-left-color': value + unit,
                'border-right-color': value + unit
            }
        },
    },
    borderYColor: {
        match: '^b(?:y|order-y(?:-color)?):(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))[^|]*$',
        order: -.5,
        colored: true,
        values: {
            current: 'currentColor'
        },
        declare(value, unit) {
            return {
                'border-top-color': value + unit,
                'border-bottom-color': value + unit
            }
        },
    },
    borderColor: {
        match: '^b(?:order)?(?:-color)?:(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))[^|]*$',
        native: true,
        order: -1,
        colored: true,
        values: {
            current: 'currentColor'
        },
    },
    // border radius
    borderTopLeftRadius: {
        match: '^r(?:tl|lt):.',
        unit: 'rem',
        native: true
    },
    borderTopRightRadius: {
        match: '^r(?:tr|rt):.',
        unit: 'rem',
        native: true
    },
    borderBottomLeftRadius: {
        match: '^r(?:bl|lb):.',
        unit: 'rem',
        native: true
    },
    borderBottomRightRadius: {
        match: '^r(?:br|rb):.',
        unit: 'rem',
        native: true
    },
    borderTopRadius: {
        match: '^rt:.',
        unit: 'rem',
        order: -.5,
        declare(value, unit) {
            return {
                'border-top-left-radius': value + unit,
                'border-top-right-radius': value + unit
            }
        }
    },
    borderBottomRadius: {
        match: '^rb:.',
        unit: 'rem',
        order: -.5,
        declare(value, unit) {
            return {
                'border-bottom-left-radius': value + unit,
                'border-bottom-right-radius': value + unit
            }
        }
    },
    borderLeftRadius: {
        match: '^rl:.',
        unit: 'rem',
        order: -.5,
        declare(value, unit) {
            return {
                'border-top-left-radius': value + unit,
                'border-bottom-left-radius': value + unit
            }
        }
    },
    borderRightRadius: {
        match: '^rr:.',
        unit: 'rem',
        order: -.5,
        declare(value, unit) {
            return {
                'border-top-right-radius': value + unit,
                'border-bottom-right-radius': value + unit
            }
        }
    },
    borderRadius: {
        match: '^r:.',
        unit: 'rem',
        native: true,
        order: -1
    },
    // border style
    borderTopStyle: {
        match: '^b(?:t|order-top(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
    },
    borderBottomStyle: {
        match: '^b(?:b|order-bottom(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
    },
    borderLeftStyle: {
        match: '^b(?:l|order-left(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
    },
    borderRightStyle: {
        match: '^b(?:r|order-right(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
    },
    borderXStyle: {
        match: '^b(?:x|order-x(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        order: -.5,
        declare(value, unit) {
            return {
                'border-left-style': value + unit,
                'border-right-style': value + unit
            }
        },
    },
    borderYStyle: {
        match: '^b(?:y|order-y(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        order: -.5,
        declare(value, unit) {
            return {
                'border-top-style': value + unit,
                'border-bottom-style': value + unit
            }
        },
    },
    borderStyle: {
        match: '^b(?:order)?(?:-style)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
        order: -1
    },
    // border width
    borderTopWidth: {
        match: '^b(?:t|order-top(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
    },
    borderBottomWidth: {
        match: '^b(?:b|order-bottom(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
    },
    borderLeftWidth: {
        match: '^b(?:l|order-left(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
    },
    borderRightWidth: {
        match: '^b(?:r|order-right(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
    },
    borderXWidth: {
        match: '^b(?:x|order-x(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        order: -.5,
        declare(value, unit) {
            return {
                'border-left-width': value + unit,
                'border-right-width': value + unit
            }
        },
    },
    borderYWidth: {
        match: '^b(?:y|order-y(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        order: -.5,
        declare(value, unit) {
            return {
                'border-top-width': value + unit,
                'border-bottom-width': value + unit
            }
        },
    },
    borderWidth: {
        match: '^b(?:order)?(?:-width)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
        order: -1
    },
    // border image
    borderImageOutset: {
        unit: 'rem',
        native: true
    },
    borderImageRepeat: {
        match: '^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)',
        native: true
    },
    borderImageSlice: {
        native: true
    },
    borderImageSource: {
        match: '^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)',
        native: true
    },
    borderImageWidth: {
        match: '^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true
    },
    borderImage: {
        native: true,
        order: -1
    },
    // border
    borderTop: {
        match: '^bt:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    borderBottom: {
        match: '^bb:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    borderLeft: {
        match: '^bl:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    borderRight: {
        match: '^br:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    borderX: {
        match: '^(?:bx|border-x):.',
        unit: 'rem',
        colored: true,
        order: -.5,
        values: {
            current: 'currentColor'
        },
        declare(value) {
            return {
                'border-left': value,
                'border-right': value
            }
        },
    },
    borderY: {
        match: '^(?:by|border-y):.',
        unit: 'rem',
        colored: true,
        order: -.5,
        values: {
            current: 'currentColor'
        },
        declare(value) {
            return {
                'border-top': value,
                'border-bottom': value
            }
        },
    },
    border: {
        match: '^b:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        },
        order: -2
    },
    backgroundAttachment: {
        match: '^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)',
        native: true
    },
    backgroundBlendMode: {
        native: true
    },
    backgroundColor: {
        match: '^(?:bg|background):(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    backgroundClip: {
        match: '^(?:bg|background):(?:text|$values)(?!\\|)',
        native: true,
        declare(value, unit) {
            return {
                '-webkit-background-clip': value + unit,
                'background-clip': value + unit
            }
        },
        values: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box'
        }
    },
    backgroundOrigin: {
        match: '^(?:bg|background):(?:$values)(?!\\|)',
        native: true,
        values: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box'
        }
    },
    backgroundPosition: {
        match: '^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)',
        native: true,
        unit: 'px'
    },
    backgroundRepeat: {
        match: '^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])',
        native: true
    },
    backgroundSize: {
        match: '^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)',
        unit: 'rem',
        native: true
    },
    backgroundImage: {
        match: '^(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    background: {
        match: '^bg:.',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
        order: -1
    },
    mixBlendMode: {
        match: '^blend:.',
        native: true
    },
    backdropFilter: {
        match: '^bd:.',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
        declare(value, unit) {
            return {
                'backdrop-filter': value + unit,
                '-webkit-backdrop-filter': value + unit
            }
        }
    },
    filter: {
        match: '^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\\(',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    fill: {
        match: '^fill:(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    strokeDasharray: {
        native: true
    },
    strokeDashoffset: {
        native: true
    },
    strokeWidth: {
        match: '^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        native: true
    },
    stroke: {
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    x: {
        native: true
    },
    y: {
        native: true
    },
    cx: {
        native: true
    },
    cy: {
        native: true
    },
    rx: {
        native: true
    },
    ry: {
        native: true
    },
    gridColumnStart: {
        match: '^grid-col-start:.',
        native: true
    },
    gridColumnEnd: {
        match: '^grid-col-end:.',
        native: true
    },
    gridColumn: {
        match: '^grid-col(?:umn)?(?:-span)?:.',
        native: true,
        order: -1,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    },
    gridColumns: {
        match: '^grid-cols:.',
        declare(value, unit) {
            return {
                display: 'grid',
                'grid-template-columns': 'repeat'
                    + '(' + value + unit
                    + ','
                    + 'minmax'
                    + '(' + 0 + ',' + 1 + 'fr' + '))',
            }
        }
    },
    gridRowStart: {
        native: true
    },
    gridRowEnd: {
        native: true
    },
    gridRow: {
        match: '^grid-row-span:.',
        native: true,
        order: -1,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    },
    gridRows: {
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
        }
    },
    gridAutoColumns: {
        match: '^grid-auto-cols:.',
        native: true,
        values: {
            min: 'min-content',
            max: 'max-content'
        }
    },
    gridAutoFlow: {
        match: '^grid-flow:.',
        native: true
    },
    gridAutoRows: {
        values: {
            min: 'min-content',
            max: 'max-content'
        },
        native: true
    },
    gridTemplateAreas: {
        native: true
    },
    gridTemplateColumns: {
        match: '^grid-template-cols:.',
        native: true,
        unit: 'rem',
        values: {
            min: 'min-content',
            max: 'max-content'
        }
    },
    gridTemplateRows: {
        native: true,
        unit: 'rem',
        values: {
            min: 'min-content',
            max: 'max-content'
        }
    },
    gridTemplate: {
        native: true,
        order: -1
    },
    gridArea: {
        native: true,
        order: -1
    },
    grid: {
        native: true,
        order: -1
    },
    gapX: {
        unit: 'rem',
        native: true
    },
    gapY: {
        unit: 'rem',
        native: true
    },
    gap: {
        unit: 'rem',
        native: true,
        order: -1
    },
    order: {
        match: '^o:.',
        native: true,
        values: {
            first: -999999,
            last: 999999
        }
    },
    breakInside: {
        native: true
    },
    breakBefore: {
        native: true
    },
    breakAfter: {
        native: true
    },
    boxDecorationBreak: {
        match: '^box:(?:slice|clone|$values)(?!\\|)',
        native: true,
        declare(value, unit) {
            return {
                'box-decoration-break': value + unit,
                '-webkit-box-decoration-break': value + unit
            }
        }
    },
    aspectRatio: {
        match: '^aspect:.',
        native: true
    },
    columnSpan: {
        match: '^col-span:.',
        native: true
    },
    alignContent: {
        match: '^ac:.',
        native: true
    },
    alignItems: {
        match: '^ai:.',
        native: true
    },
    alignSelf: {
        match: '^as:',
        native: true
    },
    justifyContent: {
        match: '^jc:.',
        native: true
    },
    justifyItems: {
        match: '^ji:.',
        native: true
    },
    justifySelf: {
        match: '^js:.',
        native: true
    },
    placeContent: {
        native: true,
        order: -1
    },
    placeItems: {
        native: true,
        order: -1
    },
    placeSelf: {
        native: true,
        order: -1
    },
    listStylePosition: {
        match: '^list-style:(?:inside|outside|$values)(?!\\|)',
        native: true
    },
    listStyleType: {
        match: '^list-style:(?:disc|decimal|$values)(?!\\|)',
        native: true
    },
    listStyleImage: {
        match: '^list-style:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)',
        native: true
    },
    listStyle: {
        native: true,
        order: -1
    },
    outlineColor: {
        match: '^outline:(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    outlineOffset: {
        unit: 'rem',
        native: true
    },
    outlineStyle: {
        match: '^outline:(?:none|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true
    },
    outlineWidth: {
        match: '^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true
    },
    outline: {
        native: true,
        unit: 'rem',
        order: -1,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    accentColor: {
        match: '^accent:(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    appearance: {
        native: true
    },
    caretColor: {
        match: '^caret:(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    },
    scrollBehavior: {
        native: true
    },
    // scroll margin
    scrollMarginLeft: {
        match: '^sml:.',
        native: true,
        unit: 'rem'
    },
    scrollMarginRight: {
        match: '^smr:.',
        native: true,
        unit: 'rem'
    },
    scrollMarginTop: {
        match: '^smt:.',
        native: true,
        unit: 'rem'
    },
    scrollMarginBottom: {
        match: '^smb:.',
        native: true,
        unit: 'rem'
    },
    scrollMarginX: {
        match: '^(?:smx|scroll-margin-x):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'scroll-margin-left': value + unit,
                'scroll-margin-right': value + unit
            }
        },
    },
    scrollMarginY: {
        match: '^(?:smy|scroll-margin-y):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'scroll-margin-top': value + unit,
                'scroll-margin-bottom': value + unit
            }
        },
    },
    scrollMargin: {
        match: '^sm:.',
        native: true,
        unit: 'rem',
        order: -1
    },
    // scroll padding
    scrollPaddingLeft: {
        match: '^spl:.',
        native: true,
        unit: 'rem'
    },
    scrollPaddingRight: {
        match: '^spr:.',
        native: true,
        unit: 'rem'
    },
    scrollPaddingTop: {
        match: '^spt:.',
        native: true,
        unit: 'rem'
    },
    scrollPaddingBottom: {
        match: '^spb:.',
        native: true,
        unit: 'rem'
    },
    scrollPaddingX: {
        match: '^(?:spx|scroll-padding-x):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'scroll-padding-left': value + unit,
                'scroll-padding-right': value + unit
            }
        },
    },
    scrollPaddingY: {
        match: '^(?:spy|scroll-padding-y):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'scroll-padding-top': value + unit,
                'scroll-padding-bottom': value + unit
            }
        },
    },
    scrollPadding: {
        match: '^sp:.',
        native: true,
        unit: 'rem',
        order: -1
    },
    // scroll snap
    scrollSnapAlign: {
        match: '^scroll-snap:(?:start|end|center|$values)',
        native: true
    },
    scrollSnapStop: {
        match: '^scroll-snap:(?:normal|always|$values)(?!\\|)',
        native: true
    },
    scrollSnapType: {
        match: '^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)',
        native: true
    },
    willChange: {
        native: true
    },
    writingMode: {
        match: '^writing:.',
        native: true
    },
    direction: {
        native: true
    },
    shapeOutside: {
        match: '^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)',
        native: true,
        values: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box',
            margin: 'margin-box'
        }
    },
    shapeMargin: {
        match: '^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true
    },
    shapeImageThreshold: {
        native: true
    },
    clipPath: {
        match: '^clip:.',
        native: true,
        values: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box',
            margin: 'margin-box',
            fill: 'fill-box',
            stroke: 'stroke-box',
            view: 'view-box'
        }
    },
    quotes: {
        native: true
    },
    maskImage: {
        native: true,
        declare(value, unit) {
            return {
                'mask-image': value + unit,
                '-webkit-mask-image': value + unit
            }
        }
    }
}

export const rules = defaultRules as { [key in keyof typeof defaultRules]: RuleConfig } & { [key: string]: RuleConfig }

function animationCreate(className: string) {
    if (!this.css.config.keyframes)
        return

    const keyframeNames = (
        this.meta.origin === 'symbol'
            ? className.slice(this.meta.config.symbol.length)
            : className.slice(className.indexOf(':') + 1)
    )
        .split('|')
        .filter(eachKeyframe => eachKeyframe in this.css.config.keyframes)
    if (keyframeNames?.length) {
        this.keyframeNames = keyframeNames
    }
}

function animationDelete() {
    if (this.keyframeNames?.length) {
        const keyframeRule = this.css.rules[0]
        for (const eachKeyframeName of this.keyframeNames) {
            const keyframe = this.css.keyframes[eachKeyframeName]
            if (!--keyframe.count) {
                const nativeIndex = keyframeRule.natives.indexOf(keyframe.native)
                this.css.style.sheet.deleteRule(nativeIndex)
                keyframeRule.natives.splice(nativeIndex, 1)
                delete this.css.keyframes[eachKeyframeName]
            }
        }

        if (!keyframeRule.natives.length) {
            this.css.rules.splice(0, 1)
        }
    }
}

function animationInsert() {
    if (this.keyframeNames) {
        const { config, keyframes, style, rules } = this.css
        const sheet = style?.sheet

        for (const eachKeyframeName of this.keyframeNames) {
            if (eachKeyframeName in keyframes) {
                keyframes[eachKeyframeName].count++
            } else {
                const native: RuleNative = {
                    text: `@keyframes ${eachKeyframeName}{`
                        + Object
                            .entries(config.keyframes[eachKeyframeName])
                            .map(([key, values]) => `${key}{${Object.entries(values).map(([name, value]) => name + ':' + value).join(';')}}`)
                            .join('')
                        + '}',
                    theme: ''
                }

                let keyframeRule: Rule
                if (Object.keys(keyframes).length) {
                    (keyframeRule = rules[0]).natives.push(native)
                } else {
                    rules.splice(
                        0,
                        0,
                        keyframeRule = {
                            natives: [native],
                            get text() {
                                return this.natives.map((eachNative) => eachNative.text).join('')
                            }
                        } as Rule
                    )
                }

                if (sheet) {
                    let nativeCssRule: CSSRule
                    for (let i = 0; i < sheet.cssRules.length; i++) {
                        const cssRule = sheet.cssRules[i]
                        if (cssRule.constructor.name !== 'CSSKeyframesRule')
                            break

                        if ((cssRule as CSSKeyframesRule).name === eachKeyframeName) {
                            nativeCssRule = cssRule
                            break
                        }
                    }

                    if (nativeCssRule) {
                        native.cssRule = nativeCssRule
                    } else {
                        const cssRuleIndex = keyframeRule.natives.length - 1
                        sheet.insertRule(native.text, cssRuleIndex)
                        native.cssRule = sheet.cssRules[cssRuleIndex]
                    }
                }

                keyframes[eachKeyframeName] = {
                    native,
                    count: 1
                }
            }
        }
    }
}