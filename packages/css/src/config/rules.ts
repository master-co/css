import cssEscape from 'shared/utils/css-escape'
import { START_SYMBOLS } from '../constants/start-symbol'
import { Declarations, Rule, RuleConfig } from '../rule'
import { transformColorWithOpacity } from '../functions/transform-color-with-opacity'

const defaultRules = {
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
    } as RuleConfig,
    variable: {
        match: '^\\$[^ (){}A-Z]+:[^ ]', // don't use 'rem' as default, because css variable is common API
        transform(value) {
            const regexp = new RegExp(`^((?:${this.css.colorNames.join('|')})(?:-(?:[0-9A-Za-z-]+))?)(?:\\/(\\.?[0-9]+%?))?(?:@(.*?))?$`, 'm')
            const result = regexp.exec(value)
            if (result) {
                const [, colorName, opacityStr, themeName] = result
                const color = this.css.colorThemesMap[colorName]?.[themeName || '']
                if (color)
                    return (opacityStr
                        ? transformColorWithOpacity(color, opacityStr)
                        : color)
            }

            return value
        },
        declare(value) {
            return {
                ['--' + this.prefix.slice(1, -1)]: value
            }
        }
    } as RuleConfig,
    fontSize: {
        match: '^f(?:ont)?:(?:[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true
    } as RuleConfig,
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
    } as RuleConfig,
    fontFamily: {
        match: '^f(?:ont)?:(?:$values)(?!\\|)',
        native: true,
        values: {
            mono: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
            sans: 'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
            serif: 'ui-serif,Georgia,Cambria,Times New Roman,Times,serif'
        }
    } as RuleConfig,
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
    } as RuleConfig,
    fontStyle: {
        match: '^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)',
        native: true,
        unit: 'deg'
    } as RuleConfig,
    fontVariantNumeric: {
        match: '^f(?:ont)?:(?:ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    fontFeatureSettings: {
        match: '^font-feature:.',
        native: true
    } as RuleConfig,
    font: {
        match: '^f:.',
        native: true,
        order: -1
    } as RuleConfig,
    color: {
        match: '^(?:color|fg|foreground):.',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    marginLeft: {
        match: '^ml:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    marginRight: {
        match: '^mr:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    marginTop: {
        match: '^mt:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    marginBottom: {
        match: '^mb:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    marginX: {
        match: '^(?:mx|margin-x):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'margin-left': value + unit,
                'margin-right': value + unit
            }
        }
    } as RuleConfig,
    marginY: {
        match: '^(?:my|margin-y):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'margin-top': value + unit,
                'margin-bottom': value + unit
            }
        }
    } as RuleConfig,
    margin: {
        match: '^m:.',
        native: true,
        unit: 'rem',
        order: -1
    } as RuleConfig,
    paddingLeft: {
        match: '^pl:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    paddingRight: {
        match: '^pr:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    paddingTop: {
        match: '^pt:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    paddingBottom: {
        match: '^pb:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    paddingX: {
        match: '^(?:px|padding-x):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'padding-left': value + unit,
                'padding-right': value + unit
            }
        }
    } as RuleConfig,
    paddingY: {
        match: '^(?:py|padding-y):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'padding-top': value + unit,
                'padding-bottom': value + unit
            }
        }
    } as RuleConfig,
    padding: {
        match: '^p:.',
        native: true,
        unit: 'rem',
        order: -1
    } as RuleConfig,
    flexBasis: {
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '4xs': 360,
            '3xs': 480,
            '2xs': 600,
            'xs': 768,
            'sm': 834,
            'md': 1024,
            'lg': 1280,
            'xl': 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        } as RuleConfig,
        unit: 'rem',
        native: true,
    } as RuleConfig,
    flexWrap: {
        match: '^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    flexGrow: {
        native: true
    } as RuleConfig,
    flexShrink: {
        native: true
    } as RuleConfig,
    flexDirection: {
        match: '^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)',
        native: true,
        values: {
            col: 'column',
            'col-reverse': 'column-reverse'
        }
    } as RuleConfig,
    flex: {
        native: true,
        order: -1
    } as RuleConfig,
    display: {
        match: '^d:.',
        native: true,
    } as RuleConfig,
    width: {
        match: '^w:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '4xs': 360,
            '3xs': 480,
            '2xs': 600,
            'xs': 768,
            'sm': 834,
            'md': 1024,
            'lg': 1280,
            'xl': 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    } as RuleConfig,
    height: {
        match: '^h:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '4xs': 360,
            '3xs': 480,
            '2xs': 600,
            'xs': 768,
            'sm': 834,
            'md': 1024,
            'lg': 1280,
            'xl': 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    } as RuleConfig,
    minWidth: {
        match: '^min-w:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '4xs': 360,
            '3xs': 480,
            '2xs': 600,
            'xs': 768,
            'sm': 834,
            'md': 1024,
            'lg': 1280,
            'xl': 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    } as RuleConfig,
    minHeight: {
        match: '^min-h:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '4xs': 360,
            '3xs': 480,
            '2xs': 600,
            'xs': 768,
            'sm': 834,
            'md': 1024,
            'lg': 1280,
            'xl': 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    } as RuleConfig,
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
    } as RuleConfig,
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
    } as RuleConfig,
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
    } as RuleConfig,
    contain: {
        native: true
    } as RuleConfig,
    content: {
        native: true
    } as RuleConfig,
    counterIncrement: {
        native: true
    } as RuleConfig,
    counterReset: {
        native: true,
    } as RuleConfig,
    letterSpacing: {
        match: '^ls:.',
        native: true,
        unit: 'em'
    } as RuleConfig,
    lineHeight: {
        match: '^lh:.',
        native: true
    } as RuleConfig,
    objectFit: {
        match: '^(?:object|obj):(?:contain|cover|fill|scale-down|$values)',
        native: true,
    } as RuleConfig,
    objectPosition: {
        match: '^(?:object|obj):(?:top|bottom|right|left|center|$values)',
        native: true,
    } as RuleConfig,
    textAlign: {
        match: '^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)',
        native: true,
    } as RuleConfig,
    textDecorationColor: {
        match: '^text-decoration:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    textDecorationStyle: {
        match: '^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)',
        native: true,
    } as RuleConfig,
    textDecorationThickness: {
        match: '^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$',
        native: true,
        unit: 'em'
    } as RuleConfig,
    textDecorationLine: {
        match: '^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)',
        native: true,
    } as RuleConfig,
    textDecoration: {
        match: '^t(?:ext)?:(?:underline|line-through|overline)',
        unit: 'rem',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
        order: -1
    } as RuleConfig,
    textUnderlineOffset: {
        unit: 'rem',
        native: true,
    } as RuleConfig,
    textOverflow: {
        match: '^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))',
        native: true
    } as RuleConfig,
    textOrientation: {
        match: '^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    textTransform: {
        match: '^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)',
        native: true,
    } as RuleConfig,
    textRendering: {
        match: '^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)',
        native: true,
    } as RuleConfig,
    textIndent: {
        unit: 'rem',
        native: true
    } as RuleConfig,
    verticalAlign: {
        match: '^(?:v|vertical):.',
        native: true
    } as RuleConfig,
    columns: {
        match: '^(?:columns|cols):.',
        native: true,
        order: -1
    } as RuleConfig,
    whiteSpace: {
        native: true
    } as RuleConfig,
    top: {
        native: true,
        unit: 'rem'
    } as RuleConfig,
    bottom: {
        native: true,
        unit: 'rem'
    } as RuleConfig,
    left: {
        native: true,
        unit: 'rem'
    } as RuleConfig,
    right: {
        native: true,
        unit: 'rem'
    } as RuleConfig,
    inset: {
        native: true,
        unit: 'rem',
        order: -1
    } as RuleConfig,
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
    } as RuleConfig,
    maxHeight: {
        match: '^max-h:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '4xs': 360,
            '3xs': 480,
            '2xs': 600,
            'xs': 768,
            'sm': 834,
            'md': 1024,
            'lg': 1280,
            'xl': 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    } as RuleConfig,
    maxWidth: {
        match: '^max-w:.',
        unit: 'rem',
        native: true,
        values: {
            full: '100%',
            fit: 'fit-content',
            max: 'max-content',
            min: 'min-content',
            '4xs': 360,
            '3xs': 480,
            '2xs': 600,
            'xs': 768,
            'sm': 834,
            'md': 1024,
            'lg': 1280,
            'xl': 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }
    } as RuleConfig,
    boxSizing: {
        match: '^box:(?:$values)(?!\\|)',
        native: true,
        values: {
            content: 'content-box',
            border: 'border-box',
        }
    } as RuleConfig,
    opacity: {
        native: true,
    } as RuleConfig,
    visibility: {
        native: true
    } as RuleConfig,
    clear: {
        native: true,
    } as RuleConfig,
    float: {
        native: true
    } as RuleConfig,
    isolation: {
        native: true
    } as RuleConfig,
    overflowX: {
        native: true,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-x': ['auto', value] }
                : { 'overflow-x': value }
        }
    } as RuleConfig,
    overflowY: {
        native: true,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-y': ['auto', value] }
                : { 'overflow-y': value }
        }
    } as RuleConfig,
    overflow: {
        native: true,
        order: -1,
        declare(value, unit) {
            return value === 'overlay'
                ? { overflow: ['auto', value] }
                : { overflow: value }
        }
    } as RuleConfig,
    overscrollBehaviorX: {
        native: true
    } as RuleConfig,
    overscrollBehaviorY: {
        native: true
    } as RuleConfig,
    overscrollBehavior: {
        native: true,
        order: -1
    } as RuleConfig,
    zIndex: {
        match: '^z:.',
        native: true
    } as RuleConfig,
    position: {
        native: true,
        values: {
            abs: 'absolute',
            rel: 'relative'
        }
    } as RuleConfig,
    cursor: {
        native: true
    } as RuleConfig,
    pointerEvents: {
        native: true
    } as RuleConfig,
    resize: {
        native: true
    } as RuleConfig,
    touchAction: {
        native: true
    } as RuleConfig,
    wordBreak: {
        native: true
    } as RuleConfig,
    wordSpacing: {
        native: true,
        unit: 'em'
    } as RuleConfig,
    userDrag: {
        native: true,
        declare(value, unit) {
            return {
                'user-drag': value + unit,
                '-webkit-user-drag': value + unit
            }
        }
    } as RuleConfig,
    userSelect: {
        native: true,
        declare(value, unit) {
            return {
                'user-select': value + unit,
                '-webkit-user-select': value + unit
            }
        }
    } as RuleConfig,
    textShadow: {
        unit: 'rem',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
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
    } as RuleConfig,
    textFillColor: {
        native: true,
        match: '^(?:text-fill|text|t):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        colored: true,
        values: {
            current: 'currentColor'
        },
        declare(value, unit) {
            return {
                '-webkit-text-fill-color': value + unit
            }
        }
    } as RuleConfig,
    textStrokeWidth: {
        match: '^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)',
        unit: 'rem',
        declare(value, unit) {
            return {
                '-webkit-text-stroke-width': value + unit
            }
        }
    } as RuleConfig,
    textStrokeColor: {
        match: '^text-stroke:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
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
    } as RuleConfig,
    textStroke: {
        unit: 'rem',
        native: true,
        declare(value, unit) {
            return {
                '-webkit-text-stroke': value + unit
            }
        }
    } as RuleConfig,
    boxShadow: {
        match: '^s(?:hadow)?:.',
        unit: 'rem',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    tableLayout: {
        native: true
    } as RuleConfig,
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
    } as RuleConfig,
    transformStyle: {
        match: '^transform:(?:flat|preserve-3d|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    transformOrigin: {
        match: '^transform:(?:top|bottom|right|left|center|[0-9]|$values)',
        native: true,
        unit: 'px'
    } as RuleConfig,
    transform: {
        match: '^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\\(',
        native: true,
        analyze(className: string) {
            return [className.startsWith('transform') ? className.slice(10) : className]
        }
    } as RuleConfig,
    transitionProperty: {
        match: '^~property:.',
        native: true
    } as RuleConfig,
    transitionTimingFunction: {
        match: '^~easing:.',
        native: true
    } as RuleConfig,
    transitionDuration: {
        match: '^~duration:.',
        native: true,
        unit: 'ms'
    } as RuleConfig,
    transitionDelay: {
        match: '^~delay:.',
        native: true,
        unit: 'ms'
    } as RuleConfig,
    transition: {
        match: '^~[^!*>+~:[@_]+\\|',
        native: true,
        analyze(className: string) {
            if (className.startsWith('~')) {
                return [className.slice(1)]
            } else {
                const indexOfColon = className.indexOf(':')
                this.prefix = className.slice(0, indexOfColon + 1)
                return [className.slice(indexOfColon + 1)]
            }
        },
        order: -1
    } as RuleConfig,
    animationDelay: {
        match: '^@delay:.',
        native: true,
        unit: 'ms'
    } as RuleConfig,
    animationDirection: {
        match: '^@direction:.',
        native: true,
        values: {
            alt: 'alternate',
            'alt-reverse': 'alternate-reverse'
        }
    } as RuleConfig,
    animationDuration: {
        match: '^@duration:.',
        native: true,
        unit: 'ms'
    } as RuleConfig,
    animationFillMode: {
        match: '^@fill:.',
        native: true
    } as RuleConfig,
    animationIterationCount: {
        match: '^@iteration:.',
        native: true
    } as RuleConfig,
    animationName: {
        match: '^@name:.',
        native: true
    } as RuleConfig,
    animationPlayState: {
        match: '^@play:.',
        native: true
    } as RuleConfig,
    animationTimingFunction: {
        match: '^@easing:.',
        native: true
    } as RuleConfig,
    animation: {
        match: '^@[^!*>+~:[@_]+\\|',
        native: true,
        order: -1,
        analyze(className: string) {
            if (className.startsWith('@')) {
                return [className.slice(1)]
            } else {
                const indexOfColon = className.indexOf(':')
                this.prefix = className.slice(0, indexOfColon + 1)
                return [className.slice(indexOfColon + 1)]
            }
        }
    } as RuleConfig,
    borderCollapse: {
        match: '^b(?:order)?:(?:collapse|separate|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    borderSpacing: {
        unit: 'rem',
        native: true
    } as RuleConfig,
    // border color
    borderTopColor: {
        match: '^b(?:t|order-top(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    borderBottomColor: {
        match: '^b(?:b|order-bottom(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    borderLeftColor: {
        match: '^b(?:l|order-left(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    borderRightColor: {
        match: '^b(?:r|order-right(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    borderXColor: {
        match: '^b(?:x|order-x(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
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
        }
    } as RuleConfig,
    borderYColor: {
        match: '^b(?:y|order-y(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
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
        }
    } as RuleConfig,
    borderColor: {
        match: '^b(?:order)?(?:-color)?:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        order: -1,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    // border radius
    borderTopLeftRadius: {
        match: '^r(?:tl|lt):.',
        unit: 'rem',
        native: true
    } as RuleConfig,
    borderTopRightRadius: {
        match: '^r(?:tr|rt):.',
        unit: 'rem',
        native: true
    } as RuleConfig,
    borderBottomLeftRadius: {
        match: '^r(?:bl|lb):.',
        unit: 'rem',
        native: true
    } as RuleConfig,
    borderBottomRightRadius: {
        match: '^r(?:br|rb):.',
        unit: 'rem',
        native: true
    } as RuleConfig,
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
    } as RuleConfig,
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
    } as RuleConfig,
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
    } as RuleConfig,
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
    } as RuleConfig,
    borderRadius: {
        match: '^r:.',
        unit: 'rem',
        native: true,
        order: -1
    } as RuleConfig,
    // border style
    borderTopStyle: {
        match: '^b(?:t|order-top(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
    } as RuleConfig,
    borderBottomStyle: {
        match: '^b(?:b|order-bottom(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
    } as RuleConfig,
    borderLeftStyle: {
        match: '^b(?:l|order-left(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
    } as RuleConfig,
    borderRightStyle: {
        match: '^b(?:r|order-right(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
    } as RuleConfig,
    borderXStyle: {
        match: '^b(?:x|order-x(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        order: -.5,
        declare(value, unit) {
            return {
                'border-left-style': value + unit,
                'border-right-style': value + unit
            }
        }
    } as RuleConfig,
    borderYStyle: {
        match: '^b(?:y|order-y(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        order: -.5,
        declare(value, unit) {
            return {
                'border-top-style': value + unit,
                'border-bottom-style': value + unit
            }
        }
    } as RuleConfig,
    borderStyle: {
        match: '^b(?:order)?(?:-style)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true,
        order: -1
    } as RuleConfig,
    // border width
    borderTopWidth: {
        match: '^b(?:t|order-top(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
    } as RuleConfig,
    borderBottomWidth: {
        match: '^b(?:b|order-bottom(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
    } as RuleConfig,
    borderLeftWidth: {
        match: '^b(?:l|order-left(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
    } as RuleConfig,
    borderRightWidth: {
        match: '^b(?:r|order-right(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
    } as RuleConfig,
    borderXWidth: {
        match: '^b(?:x|order-x(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        order: -.5,
        declare(value, unit) {
            return {
                'border-left-width': value + unit,
                'border-right-width': value + unit
            }
        }
    } as RuleConfig,
    borderYWidth: {
        match: '^b(?:y|order-y(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        order: -.5,
        declare(value, unit) {
            return {
                'border-top-width': value + unit,
                'border-bottom-width': value + unit
            }
        }
    } as RuleConfig,
    borderWidth: {
        match: '^b(?:order)?(?:-width)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true,
        order: -1
    } as RuleConfig,
    // border image
    borderImageOutset: {
        unit: 'rem',
        native: true
    } as RuleConfig,
    borderImageRepeat: {
        match: '^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    borderImageSlice: {
        native: true
    } as RuleConfig,
    borderImageSource: {
        match: '^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    borderImageWidth: {
        match: '^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true
    } as RuleConfig,
    borderImage: {
        native: true,
        order: -1
    } as RuleConfig,
    // border
    borderTop: {
        match: '^bt:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        } as RuleConfig,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleConfig,
    borderBottom: {
        match: '^bb:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        } as RuleConfig,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleConfig,
    borderLeft: {
        match: '^bl:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        } as RuleConfig,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleConfig,
    borderRight: {
        match: '^br:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        } as RuleConfig,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleConfig,
    borderX: {
        match: '^(?:bx|border-x):.',
        unit: 'rem',
        colored: true,
        order: -.5,
        values: {
            current: 'currentColor'
        },
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
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
    } as RuleConfig,
    borderY: {
        match: '^(?:by|border-y):.',
        unit: 'rem',
        colored: true,
        order: -.5,
        values: {
            current: 'currentColor'
        },
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
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
    } as RuleConfig,
    border: {
        match: '^b:.',
        native: true,
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        } as RuleConfig,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        },
        order: -2
    } as RuleConfig,
    backgroundAttachment: {
        match: '^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    backgroundBlendMode: {
        native: true
    } as RuleConfig,
    backgroundColor: {
        match: '^(?:bg|background):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
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
    } as RuleConfig,
    backgroundOrigin: {
        match: '^(?:bg|background):(?:$values)(?!\\|)',
        native: true,
        values: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box'
        }
    } as RuleConfig,
    backgroundPosition: {
        match: '^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)',
        native: true,
        unit: 'px'
    } as RuleConfig,
    backgroundRepeat: {
        match: '^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])',
        native: true
    } as RuleConfig,
    backgroundSize: {
        match: '^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)',
        unit: 'rem',
        native: true
    } as RuleConfig,
    backgroundImage: {
        match: '^(?:(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)|gradient\\(.*\\))(?!\\|)',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
        analyze(className: string) {
            if (className.startsWith('gradient'))
                return ['linear-' + className]

            const indexOfColon = className.indexOf(':')
            this.prefix = className.slice(0, indexOfColon + 1)
            return [className.slice(indexOfColon + 1)]
        }
    } as RuleConfig,
    background: {
        match: '^bg:.',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        },
        order: -1
    } as RuleConfig,
    mixBlendMode: {
        match: '^blend:.',
        native: true
    } as RuleConfig,
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
    } as RuleConfig,
    filter: {
        match: '^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\\(',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    fill: {
        match: '^fill:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    strokeDasharray: {
        native: true
    } as RuleConfig,
    strokeDashoffset: {
        native: true
    } as RuleConfig,
    strokeWidth: {
        match: '^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        native: true
    } as RuleConfig,
    stroke: {
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    x: {
        native: true
    } as RuleConfig,
    y: {
        native: true
    } as RuleConfig,
    cx: {
        native: true
    } as RuleConfig,
    cy: {
        native: true
    } as RuleConfig,
    rx: {
        native: true
    } as RuleConfig,
    ry: {
        native: true
    } as RuleConfig,
    gridColumnStart: {
        match: '^grid-col-start:.',
        native: true
    } as RuleConfig,
    gridColumnEnd: {
        match: '^grid-col-end:.',
        native: true
    } as RuleConfig,
    gridColumn: {
        match: '^grid-col(?:umn)?(?:-span)?:.',
        native: true,
        order: -1,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleConfig,
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
    } as RuleConfig,
    gridRowStart: {
        native: true
    } as RuleConfig,
    gridRowEnd: {
        native: true
    } as RuleConfig,
    gridRow: {
        match: '^grid-row-span:.',
        native: true,
        order: -1,
        transform(value) {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    } as RuleConfig,
    gridRows: {
        match: '^grid-rows:.',
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
    } as RuleConfig,
    gridAutoColumns: {
        match: '^grid-auto-cols:.',
        native: true,
        values: {
            min: 'min-content',
            max: 'max-content'
        }
    } as RuleConfig,
    gridAutoFlow: {
        match: '^grid-flow:.',
        native: true
    } as RuleConfig,
    gridAutoRows: {
        values: {
            min: 'min-content',
            max: 'max-content'
        } as RuleConfig,
        native: true
    } as RuleConfig,
    gridTemplateAreas: {
        native: true
    } as RuleConfig,
    gridTemplateColumns: {
        match: '^grid-template-cols:.',
        native: true,
        unit: 'rem',
        values: {
            min: 'min-content',
            max: 'max-content'
        }
    } as RuleConfig,
    gridTemplateRows: {
        native: true,
        unit: 'rem',
        values: {
            min: 'min-content',
            max: 'max-content'
        }
    } as RuleConfig,
    gridTemplate: {
        native: true,
        order: -1
    } as RuleConfig,
    gridArea: {
        native: true,
        order: -1
    } as RuleConfig,
    grid: {
        native: true,
        order: -1
    } as RuleConfig,
    columnGap: {
        match: '^gap-x:.',
        unit: 'rem',
        native: true
    } as RuleConfig,
    rowGap: {
        match: '^gap-y:.',
        unit: 'rem',
        native: true
    } as RuleConfig,
    gap: {
        unit: 'rem',
        native: true,
        order: -1
    } as RuleConfig,
    order: {
        match: '^o:.',
        native: true,
        values: {
            first: -999999,
            last: 999999
        }
    } as RuleConfig,
    breakInside: {
        native: true
    } as RuleConfig,
    breakBefore: {
        native: true
    } as RuleConfig,
    breakAfter: {
        native: true
    } as RuleConfig,
    boxDecorationBreak: {
        match: '^box:(?:slice|clone|$values)(?!\\|)',
        native: true,
        declare(value, unit) {
            return {
                'box-decoration-break': value + unit,
                '-webkit-box-decoration-break': value + unit
            }
        }
    } as RuleConfig,
    aspectRatio: {
        match: '^aspect:.',
        native: true
    } as RuleConfig,
    columnSpan: {
        match: '^col-span:.',
        native: true
    } as RuleConfig,
    alignContent: {
        match: '^ac:.',
        native: true
    } as RuleConfig,
    alignItems: {
        match: '^ai:.',
        native: true
    } as RuleConfig,
    alignSelf: {
        match: '^as:',
        native: true
    } as RuleConfig,
    justifyContent: {
        match: '^jc:.',
        native: true
    } as RuleConfig,
    justifyItems: {
        match: '^ji:.',
        native: true
    } as RuleConfig,
    justifySelf: {
        match: '^js:.',
        native: true
    } as RuleConfig,
    placeContent: {
        native: true,
        order: -1
    } as RuleConfig,
    placeItems: {
        native: true,
        order: -1
    } as RuleConfig,
    placeSelf: {
        native: true,
        order: -1
    } as RuleConfig,
    listStylePosition: {
        match: '^list-style:(?:inside|outside|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    listStyleType: {
        match: '^list-style:(?:disc|decimal|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    listStyleImage: {
        match: '^list-style:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    listStyle: {
        native: true,
        order: -1
    } as RuleConfig,
    outlineColor: {
        match: '^outline:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    outlineOffset: {
        unit: 'rem',
        native: true
    } as RuleConfig,
    outlineStyle: {
        match: '^outline:(?:none|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    outlineWidth: {
        match: '^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true
    } as RuleConfig,
    outline: {
        native: true,
        unit: 'rem',
        order: -1,
        colored: true,
        values: {
            current: 'currentColor'
        } as RuleConfig,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleConfig,
    accentColor: {
        match: '^accent:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    appearance: {
        native: true
    } as RuleConfig,
    caretColor: {
        match: '^caret:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|currentColor|inherit|$values|$colors)[^|]*$',
        native: true,
        colored: true,
        values: {
            current: 'currentColor'
        }
    } as RuleConfig,
    scrollBehavior: {
        native: true
    } as RuleConfig,
    // scroll margin
    scrollMarginLeft: {
        match: '^scroll-ml:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    scrollMarginRight: {
        match: '^scroll-mr:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    scrollMarginTop: {
        match: '^scroll-mt:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    scrollMarginBottom: {
        match: '^scroll-mb:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    scrollMarginX: {
        match: '^(?:scroll-margin-x|scroll-mx):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'scroll-margin-left': value + unit,
                'scroll-margin-right': value + unit
            }
        }
    } as RuleConfig,
    scrollMarginY: {
        match: '^(?:scroll-margin-y|scroll-my):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'scroll-margin-top': value + unit,
                'scroll-margin-bottom': value + unit
            }
        }
    } as RuleConfig,
    scrollMargin: {
        match: '^scroll-m:.',
        native: true,
        unit: 'rem',
        order: -1
    } as RuleConfig,
    // scroll padding
    scrollPaddingLeft: {
        match: '^scroll-pl:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    scrollPaddingRight: {
        match: '^scroll-pr:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    scrollPaddingTop: {
        match: '^scroll-pt:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    scrollPaddingBottom: {
        match: '^scroll-pb:.',
        native: true,
        unit: 'rem'
    } as RuleConfig,
    scrollPaddingX: {
        match: '^(?:scroll-padding-x|scroll-px):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'scroll-padding-left': value + unit,
                'scroll-padding-right': value + unit
            }
        }
    } as RuleConfig,
    scrollPaddingY: {
        match: '^(?:scroll-padding-y|scroll-py):.',
        unit: 'rem',
        order: -0.5,
        declare(value, unit) {
            return {
                'scroll-padding-top': value + unit,
                'scroll-padding-bottom': value + unit
            }
        }
    } as RuleConfig,
    scrollPadding: {
        match: '^scroll-p:.',
        native: true,
        unit: 'rem',
        order: -1
    } as RuleConfig,
    // scroll snap
    scrollSnapAlign: {
        match: '^scroll-snap:(?:start|end|center|$values)',
        native: true
    } as RuleConfig,
    scrollSnapStop: {
        match: '^scroll-snap:(?:normal|always|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    scrollSnapType: {
        match: '^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)',
        native: true
    } as RuleConfig,
    willChange: {
        native: true
    } as RuleConfig,
    writingMode: {
        match: '^writing:.',
        native: true
    } as RuleConfig,
    direction: {
        native: true
    } as RuleConfig,
    shapeOutside: {
        match: '^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)',
        native: true,
        values: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box',
            margin: 'margin-box'
        }
    } as RuleConfig,
    shapeMargin: {
        match: '^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        native: true
    } as RuleConfig,
    shapeImageThreshold: {
        native: true
    } as RuleConfig,
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
    } as RuleConfig,
    quotes: {
        native: true
    } as RuleConfig,
    maskImage: {
        native: true,
        declare(value, unit) {
            return {
                'mask-image': value + unit,
                '-webkit-mask-image': value + unit
            }
        }
    }
} as const

const rules = defaultRules as Rules

export default rules

export type Rules = { [key in keyof typeof defaultRules]?: RuleConfig } & { [key: string]: RuleConfig }