import cssEscape from 'shared/utils/css-escape'
import { START_SYMBOLS } from '../constants/start-symbol'
import type { Rule } from '../rule'
import { transformColorWithOpacity } from '../functions/transform-color-with-opacity'
import { CSSDeclarations } from 'src/types/css-declarations'
import { Layer } from '../layer'
import type { Config } from '.'

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
        layer: Layer.CoreNative
    } as RuleConfig,
    fontWeight: {
        match: '^f(?:ont)?:(?:bolder|$values)(?!\\|)',
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative,
        values() {
            return this.fonts
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
        layer: Layer.CoreNative,
        unit: 'deg'
    } as RuleConfig,
    fontVariantNumeric: {
        match: '^f(?:ont)?:(?:ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    fontFeatureSettings: {
        match: '^font-feature:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    font: {
        match: '^f:.',
        layer: Layer.CoreNativeShorthand,
        values({ fontSize, fontStyle, fontWeight, lineHeight }) {
            return {
                ...fontSize,
                ...fontStyle,
                ...fontWeight,
                ...lineHeight,
                ...this.fonts
            }
        }
    } as RuleConfig,
    color: {
        match: '^(?:color|fg|foreground):.',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    marginLeft: {
        match: '^ml:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    marginRight: {
        match: '^mr:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    marginTop: {
        match: '^mt:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    marginBottom: {
        match: '^mb:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    marginX: {
        match: '^(?:mx|margin-x):.',
        unit: 'rem',
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'margin-top': value + unit,
                'margin-bottom': value + unit
            }
        }
    } as RuleConfig,
    margin: {
        match: '^m:.',
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    paddingLeft: {
        match: '^pl:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    paddingRight: {
        match: '^pr:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    paddingTop: {
        match: '^pt:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    paddingBottom: {
        match: '^pb:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    paddingX: {
        match: '^(?:px|padding-x):.',
        unit: 'rem',
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'padding-top': value + unit,
                'padding-bottom': value + unit
            }
        }
    } as RuleConfig,
    padding: {
        match: '^p:.',
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
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
        },
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleConfig,
    flexWrap: {
        match: '^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    flexGrow: {
        layer: Layer.CoreNative
    } as RuleConfig,
    flexShrink: {
        layer: Layer.CoreNative
    } as RuleConfig,
    flexDirection: {
        match: '^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)',
        layer: Layer.CoreNative,
        values: {
            col: 'column',
            'col-reverse': 'column-reverse'
        }
    } as RuleConfig,
    flex: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    display: {
        match: '^d:.',
        layer: Layer.CoreNative,
    } as RuleConfig,
    width: {
        match: '^w:.',
        unit: 'rem',
        layer: Layer.CoreNative,
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
    Height: {
        match: '^h:.',
        unit: 'rem',
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative
    } as RuleConfig,
    content: {
        layer: Layer.CoreNative
    } as RuleConfig,
    counterIncrement: {
        layer: Layer.CoreNative
    } as RuleConfig,
    counterReset: {
        layer: Layer.CoreNative,
    } as RuleConfig,
    letterSpacing: {
        match: '^ls:.',
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleConfig,
    lineHeight: {
        match: '^lh:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    objectFit: {
        match: '^(?:object|obj):(?:contain|cover|fill|scale-down|$values)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    objectPosition: {
        match: '^(?:object|obj):(?:top|bottom|right|left|center|$values)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    textAlign: {
        match: '^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    textDecorationColor: {
        match: '^text-decoration:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    textDecorationStyle: {
        match: '^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    textDecorationThickness: {
        match: '^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$',
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleConfig,
    textDecorationLine: {
        match: '^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    textDecoration: {
        match: '^t(?:ext)?:(?:underline|line-through|overline)',
        unit: 'rem',
        colored: true,
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    textUnderlineOffset: {
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleConfig,
    textOverflow: {
        match: '^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))',
        layer: Layer.CoreNative
    } as RuleConfig,
    textOrientation: {
        match: '^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    textTransform: {
        match: '^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    textRendering: {
        match: '^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    textIndent: {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    verticalAlign: {
        match: '^(?:v|vertical):.',
        layer: Layer.CoreNative
    } as RuleConfig,
    columns: {
        match: '^(?:columns|cols):.',
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    whiteSpace: {
        layer: Layer.CoreNative
    } as RuleConfig,
    top: {
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    bottom: {
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    left: {
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    right: {
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    inset: {
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
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
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative,
        values: {
            content: 'content-box',
            border: 'border-box',
        }
    } as RuleConfig,
    opacity: {
        layer: Layer.CoreNative,
    } as RuleConfig,
    visibility: {
        layer: Layer.CoreNative
    } as RuleConfig,
    clear: {
        layer: Layer.CoreNative,
    } as RuleConfig,
    float: {
        layer: Layer.CoreNative
    } as RuleConfig,
    isolation: {
        layer: Layer.CoreNative
    } as RuleConfig,
    overflowX: {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-x': ['auto', value] }
                : { 'overflow-x': value }
        }
    } as RuleConfig,
    overflowY: {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return value === 'overlay'
                ? { 'overflow-y': ['auto', value] }
                : { 'overflow-y': value }
        }
    } as RuleConfig,
    overflow: {
        layer: Layer.CoreNativeShorthand,
        declare(value, unit) {
            return value === 'overlay'
                ? { overflow: ['auto', value] }
                : { overflow: value }
        }
    } as RuleConfig,
    overscrollBehaviorX: {
        layer: Layer.CoreNative
    } as RuleConfig,
    overscrollBehaviorY: {
        layer: Layer.CoreNative
    } as RuleConfig,
    overscrollBehavior: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    zIndex: {
        match: '^z:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    position: {
        layer: Layer.CoreNative,
        values: {
            abs: 'absolute',
            rel: 'relative'
        }
    } as RuleConfig,
    cursor: {
        layer: Layer.CoreNative
    } as RuleConfig,
    pointerEvents: {
        layer: Layer.CoreNative
    } as RuleConfig,
    resize: {
        layer: Layer.CoreNative
    } as RuleConfig,
    touchAction: {
        layer: Layer.CoreNative
    } as RuleConfig,
    wordBreak: {
        layer: Layer.CoreNative
    } as RuleConfig,
    wordSpacing: {
        layer: Layer.CoreNative,
        unit: 'em'
    } as RuleConfig,
    userDrag: {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'user-drag': value + unit,
                '-webkit-user-drag': value + unit
            }
        }
    } as RuleConfig,
    userSelect: {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'user-select': value + unit,
                '-webkit-user-select': value + unit
            }
        }
    } as RuleConfig,
    textShadow: {
        unit: 'rem',
        layer: Layer.CoreNative,
        colored: true
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
        layer: Layer.CoreNative,
        match: '^(?:text-fill|text|t):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        colored: true,
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
        match: '^text-stroke:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true,
        declare(value, unit) {
            return {
                '-webkit-text-stroke-color': value + unit
            }
        }
    } as RuleConfig,
    textStroke: {
        unit: 'rem',
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                '-webkit-text-stroke': value + unit
            }
        }
    } as RuleConfig,
    boxShadow: {
        match: '^s(?:hadow)?:.',
        unit: 'rem',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    tableLayout: {
        layer: Layer.CoreNative
    } as RuleConfig,
    transformBox: {
        match: '^transform:(?:$values)(?!\\|)',
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative
    } as RuleConfig,
    transformOrigin: {
        match: '^transform:(?:top|bottom|right|left|center|[0-9]|$values)',
        layer: Layer.CoreNative,
        unit: 'px'
    } as RuleConfig,
    transform: {
        match: '^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\\(',
        layer: Layer.CoreNative,
        analyze(className: string) {
            return [className.startsWith('transform') ? className.slice(10) : className]
        }
    } as RuleConfig,
    transitionProperty: {
        match: '^~property:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    transitionTimingFunction: {
        match: '^~easing:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    transitionDuration: {
        match: '^~duration:.',
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleConfig,
    transitionDelay: {
        match: '^~delay:.',
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleConfig,
    transition: {
        match: '^~[^!*>+~:[@_]+\\|',
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
    } as RuleConfig,
    animationDelay: {
        match: '^@delay:.',
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleConfig,
    animationDirection: {
        match: '^@direction:.',
        layer: Layer.CoreNative,
        values: {
            alt: 'alternate',
            'alt-reverse': 'alternate-reverse'
        }
    } as RuleConfig,
    animationDuration: {
        match: '^@duration:.',
        layer: Layer.CoreNative,
        unit: 'ms'
    } as RuleConfig,
    animationFillMode: {
        match: '^@fill:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    animationIterationCount: {
        match: '^@iteration:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    animationName: {
        match: '^@name:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    animationPlayState: {
        match: '^@play:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    animationTimingFunction: {
        match: '^@easing:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    animation: {
        match: '^@[^!*>+~:[@_]+\\|',
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
    } as RuleConfig,
    borderCollapse: {
        match: '^b(?:order)?:(?:collapse|separate|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    borderSpacing: {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    // border color
    borderTopColor: {
        match: '^b(?:t|order-top(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    borderBottomColor: {
        match: '^b(?:b|order-bottom(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    borderLeftColor: {
        match: '^b(?:l|order-left(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    borderRightColor: {
        match: '^b(?:r|order-right(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    borderXColor: {
        match: '^b(?:x|order-x(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreShorthand,
        colored: true,
        declare(value, unit) {
            return {
                'border-left-color': value + unit,
                'border-right-color': value + unit
            }
        }
    } as RuleConfig,
    borderYColor: {
        match: '^b(?:y|order-y(?:-color)?):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreShorthand,
        colored: true,
        declare(value, unit) {
            return {
                'border-top-color': value + unit,
                'border-bottom-color': value + unit
            }
        }
    } as RuleConfig,
    borderColor: {
        match: '^b(?:order)?(?:-color)?:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNativeShorthand,
        colored: true
    } as RuleConfig,
    // border radius
    borderTopLeftRadius: {
        match: '^r(?:tl|lt):.',
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    borderTopRightRadius: {
        match: '^r(?:tr|rt):.',
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    borderBottomLeftRadius: {
        match: '^r(?:bl|lb):.',
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    borderBottomRightRadius: {
        match: '^r(?:br|rb):.',
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    borderTopRadius: {
        match: '^rt:.',
        unit: 'rem',
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    // border style
    borderTopStyle: {
        match: '^b(?:t|order-top(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    borderBottomStyle: {
        match: '^b(?:b|order-bottom(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    borderLeftStyle: {
        match: '^b(?:l|order-left(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    borderRightStyle: {
        match: '^b(?:r|order-right(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        layer: Layer.CoreNative,
    } as RuleConfig,
    borderXStyle: {
        match: '^b(?:x|order-x(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-left-style': value + unit,
                'border-right-style': value + unit
            }
        }
    } as RuleConfig,
    borderYStyle: {
        match: '^b(?:y|order-y(?:-style)?):(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'border-top-style': value + unit,
                'border-bottom-style': value + unit
            }
        }
    } as RuleConfig,
    borderStyle: {
        match: '^b(?:order)?(?:-style)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    // border width
    borderTopWidth: {
        match: '^b(?:t|order-top(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleConfig,
    borderBottomWidth: {
        match: '^b(?:b|order-bottom(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleConfig,
    borderLeftWidth: {
        match: '^b(?:l|order-left(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleConfig,
    borderRightWidth: {
        match: '^b(?:r|order-right(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        layer: Layer.CoreNative,
    } as RuleConfig,
    borderXWidth: {
        match: '^b(?:x|order-x(?:-width)?):(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    // border image
    borderImageOutset: {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    borderImageRepeat: {
        match: '^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    borderImageSlice: {
        layer: Layer.CoreNative
    } as RuleConfig,
    borderImageSource: {
        match: '^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    borderImageWidth: {
        match: '^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    borderImage: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    // border
    borderTop: {
        match: '^bt:.',
        layer: Layer.CoreNative,
        unit: 'rem',
        colored: true,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleConfig,
    borderBottom: {
        match: '^bb:.',
        layer: Layer.CoreNative,
        unit: 'rem',
        colored: true,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleConfig,
    borderLeft: {
        match: '^bl:.',
        layer: Layer.CoreNative,
        unit: 'rem',
        colored: true,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleConfig,
    borderRight: {
        match: '^br:.',
        layer: Layer.CoreNative,
        unit: 'rem',
        colored: true,
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
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreShorthand,
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
        unit: 'rem',
        colored: true,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        },
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    backgroundAttachment: {
        match: '^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    backgroundBlendMode: {
        layer: Layer.CoreNative
    } as RuleConfig,
    backgroundColor: {
        match: '^(?:bg|background):(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    backgroundClip: {
        match: '^(?:bg|background):(?:text|$values)(?!\\|)',
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative,
        values: {
            content: 'content-box',
            border: 'border-box',
            padding: 'padding-box'
        }
    } as RuleConfig,
    backgroundPosition: {
        match: '^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)',
        layer: Layer.CoreNative,
        unit: 'px'
    } as RuleConfig,
    backgroundRepeat: {
        match: '^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])',
        layer: Layer.CoreNative
    } as RuleConfig,
    backgroundSize: {
        match: '^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)',
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    backgroundImage: {
        match: '^(?:(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient))|gradient|background-image:$values)\\(.*\\)(?!\\|)',
        layer: Layer.CoreNative,
        colored: true,
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
        colored: true,
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    mixBlendMode: {
        match: '^blend:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    backdropFilter: {
        match: '^bd:.',
        layer: Layer.CoreNative,
        colored: true,
        declare(value, unit) {
            return {
                'backdrop-filter': value + unit,
                '-webkit-backdrop-filter': value + unit
            }
        }
    } as RuleConfig,
    filter: {
        match: '^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\\(',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    fill: {
        match: '^fill:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    strokeDasharray: {
        layer: Layer.CoreNative
    } as RuleConfig,
    strokeDashoffset: {
        layer: Layer.CoreNative
    } as RuleConfig,
    strokeWidth: {
        match: '^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        layer: Layer.CoreNative
    } as RuleConfig,
    stroke: {
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    x: {
        layer: Layer.CoreNative
    } as RuleConfig,
    y: {
        layer: Layer.CoreNative
    } as RuleConfig,
    cx: {
        layer: Layer.CoreNative
    } as RuleConfig,
    cy: {
        layer: Layer.CoreNative
    } as RuleConfig,
    rx: {
        layer: Layer.CoreNative
    } as RuleConfig,
    ry: {
        layer: Layer.CoreNative
    } as RuleConfig,
    gridColumnStart: {
        match: '^grid-col-start:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    gridColumnEnd: {
        match: '^grid-col-end:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    gridColumn: {
        match: '^grid-col(?:umn)?(?:-span)?:.',
        layer: Layer.CoreNativeShorthand,
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
        layer: Layer.CoreNative
    } as RuleConfig,
    gridRowEnd: {
        layer: Layer.CoreNative
    } as RuleConfig,
    gridRow: {
        match: '^grid-row-span:.',
        layer: Layer.CoreNativeShorthand,
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
        layer: Layer.CoreNative,
        values: {
            min: 'min-content',
            max: 'max-content'
        }
    } as RuleConfig,
    gridAutoFlow: {
        match: '^grid-flow:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    gridAutoRows: {
        values: {
            min: 'min-content',
            max: 'max-content'
        },
        layer: Layer.CoreNative
    } as RuleConfig,
    gridTemplateAreas: {
        layer: Layer.CoreNative
    } as RuleConfig,
    gridTemplateColumns: {
        match: '^grid-template-cols:.',
        layer: Layer.CoreNative,
        unit: 'rem',
        values: {
            min: 'min-content',
            max: 'max-content'
        }
    } as RuleConfig,
    gridTemplateRows: {
        layer: Layer.CoreNative,
        unit: 'rem',
        values: {
            min: 'min-content',
            max: 'max-content'
        }
    } as RuleConfig,
    gridTemplate: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    gridArea: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    grid: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    columnGap: {
        match: '^gap-x:.',
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    rowGap: {
        match: '^gap-y:.',
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    gap: {
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    layer: {
        match: '^o:.',
        layer: Layer.CoreNative,
        values: {
            first: -999999,
            last: 999999
        }
    } as RuleConfig,
    breakInside: {
        layer: Layer.CoreNative
    } as RuleConfig,
    breakBefore: {
        layer: Layer.CoreNative
    } as RuleConfig,
    breakAfter: {
        layer: Layer.CoreNative
    } as RuleConfig,
    boxDecorationBreak: {
        match: '^box:(?:slice|clone|$values)(?!\\|)',
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'box-decoration-break': value + unit,
                '-webkit-box-decoration-break': value + unit
            }
        }
    } as RuleConfig,
    aspectRatio: {
        match: '^aspect:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    columnSpan: {
        match: '^col-span:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    alignContent: {
        match: '^ac:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    alignItems: {
        match: '^ai:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    alignSelf: {
        match: '^as:',
        layer: Layer.CoreNative
    } as RuleConfig,
    justifyContent: {
        match: '^jc:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    justifyItems: {
        match: '^ji:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    justifySelf: {
        match: '^js:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    placeContent: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    placeItems: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    placeSelf: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    listStylePosition: {
        match: '^list-style:(?:inside|outside|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    listStyleType: {
        match: '^list-style:(?:disc|decimal|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    listStyleImage: {
        match: '^list-style:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    listStyle: {
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    outlineColor: {
        match: '^outline:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    outlineOffset: {
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    outlineStyle: {
        match: '^outline:(?:none|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    outlineWidth: {
        match: '^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        unit: 'rem',
        layer: Layer.CoreNative
    } as RuleConfig,
    outline: {
        unit: 'rem',
        layer: Layer.CoreNativeShorthand,
        colored: true,
        transform(value) {
            if (!/none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(value)) {
                value += ' solid'
            }
            return value
        }
    } as RuleConfig,
    accentColor: {
        match: '^accent:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    appearance: {
        layer: Layer.CoreNative
    } as RuleConfig,
    caretColor: {
        match: '^caret:(?:#|(?:rgb|hsl)\\(.*\\)|transparent|inherit|$values|$colors)[^|]*$',
        layer: Layer.CoreNative,
        colored: true
    } as RuleConfig,
    scrollBehavior: {
        layer: Layer.CoreNative
    } as RuleConfig,
    // scroll margin
    scrollMarginLeft: {
        match: '^scroll-ml:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    scrollMarginRight: {
        match: '^scroll-mr:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    scrollMarginTop: {
        match: '^scroll-mt:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    scrollMarginBottom: {
        match: '^scroll-mb:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    scrollMarginX: {
        match: '^(?:scroll-margin-x|scroll-mx):.',
        unit: 'rem',
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'scroll-margin-top': value + unit,
                'scroll-margin-bottom': value + unit
            }
        }
    } as RuleConfig,
    scrollMargin: {
        match: '^scroll-m:.',
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    // scroll padding
    scrollPaddingLeft: {
        match: '^scroll-pl:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    scrollPaddingRight: {
        match: '^scroll-pr:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    scrollPaddingTop: {
        match: '^scroll-pt:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    scrollPaddingBottom: {
        match: '^scroll-pb:.',
        layer: Layer.CoreNative,
        unit: 'rem'
    } as RuleConfig,
    scrollPaddingX: {
        match: '^(?:scroll-padding-x|scroll-px):.',
        unit: 'rem',
        layer: Layer.CoreShorthand,
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
        layer: Layer.CoreShorthand,
        declare(value, unit) {
            return {
                'scroll-padding-top': value + unit,
                'scroll-padding-bottom': value + unit
            }
        }
    } as RuleConfig,
    scrollPadding: {
        match: '^scroll-p:.',
        unit: 'rem',
        layer: Layer.CoreNativeShorthand
    } as RuleConfig,
    // scroll snap
    scrollSnapAlign: {
        match: '^scroll-snap:(?:start|end|center|$values)',
        layer: Layer.CoreNative
    } as RuleConfig,
    scrollSnapStop: {
        match: '^scroll-snap:(?:normal|always|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    scrollSnapType: {
        match: '^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)',
        layer: Layer.CoreNative
    } as RuleConfig,
    willChange: {
        layer: Layer.CoreNative
    } as RuleConfig,
    writingMode: {
        match: '^writing:.',
        layer: Layer.CoreNative
    } as RuleConfig,
    direction: {
        layer: Layer.CoreNative
    } as RuleConfig,
    shapeOutside: {
        match: '^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)',
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative
    } as RuleConfig,
    shapeImageThreshold: {
        layer: Layer.CoreNative
    } as RuleConfig,
    clipPath: {
        match: '^clip:.',
        layer: Layer.CoreNative,
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
        layer: Layer.CoreNative
    } as RuleConfig,
    maskImage: {
        layer: Layer.CoreNative,
        declare(value, unit) {
            return {
                'mask-image': value + unit,
                '-webkit-mask-image': value + unit
            }
        }
    } as RuleConfig
} as const

export interface RuleConfig {
    id?: string
    match?: string
    _resolvedMatch?: RegExp
    order?: number
    separators?: string[]
    colored?: boolean
    unit?: any
    native?: boolean
    _semantic?: boolean
    _declarations?: CSSDeclarations
    _propName?: string
    layer?: Layer,
    values?: Config['values'],
    analyze?(this: Rule, className: string): [valueToken: string, prefixToken?: string]
    transform?(this: Rule, value: string): string
    declare?(this: Rule, value: string, unit: string): CSSDeclarations
    delete?(this: Rule, className: string): void
    create?(this: Rule, className: string): void
    insert?(this: Rule): void
}

type ExtendedRules = { [key: string]: RuleConfig };
export type DefaultRules = typeof defaultRules
export type Rules = ExtendedRules & DefaultRules
export default defaultRules as Rules
