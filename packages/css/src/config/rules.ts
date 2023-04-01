import { START_SYMBOL } from '../constants/start-symbol'
import { BOX_UNDERNEATH } from '../constants/box-underneath'
import { CONTENT_EXTREMA } from '../constants/content-extrema'
import { SIZING_VALUES } from '../constants/sizing-values'
import { Declarations, Rule, RuleConfig, RuleNative } from '../rule'

// TODO 於 index.node.ts 引入且防止被樹搖，目前被視為無副作用並被清除
import { cssEscape } from '../utils/css-escape'

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
            const props = {}
            switch (value) {
                case 'subpixel-antialiased':
                    props['-webkit-font-smoothing'] = props['-moz-osx-font-smoothing'] = 'auto'
                    break
                case 'antialiased':
                    props['-webkit-font-smoothing'] = 'antialiased'
                    props['-moz-osx-font-smoothing'] = 'grayscale'
                    break
                // default:
                //     props[WEBKIT_FONT_SMOOTHING] = props[MOZ_OSXFONT_SMOOTHING] = this;
            }
            return props
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
    margin: {
        match: '^m(?:argin(?:-(?:left|right|top|bottom))?|[xytblr]?):.',
        unit: 'rem',
        declare(value, unit) {
            return declareSpacing.call(this, value + unit)
        },
        get order(): number {
            return (this.prefix === 'margin:' || this.prefix === 'm:') ? -1 : 0
        }
    },
    padding: {
        match: '^p(?:adding(?:-(?:left|right|top|bottom))?|[xytblr]?):.',
        unit: 'rem',
        declare(value, unit) {
            return declareSpacing.call(this, value + unit)
        },
        get order(): number {
            return (this.prefix === 'padding:' || this.prefix === 'p:') ? -1 : 0
        }
    },
    flexBasis: {
        values: SIZING_VALUES,
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
        values: SIZING_VALUES
    },
    height: {
        match: '^h:.',
        unit: 'rem',
        native: true,
        values: SIZING_VALUES
    },
    minWidth: {
        match: '^min-w:.',
        unit: 'rem',
        native: true,
        values: SIZING_VALUES
    },
    minHeight: {
        match: '^min-h:.',
        unit: 'rem',
        native: true,
        values: SIZING_VALUES
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
    inset: {
        match: '^(?:top|bottom|left|right):.',
        unit: 'rem',
        native: true,
        declare(value, unit) {
            return {
                [this.prefix.slice(0, -1)]: value + unit
            }
        }
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
        values: SIZING_VALUES
    },
    maxWidth: {
        match: '^max-w:.',
        unit: 'rem',
        native: true,
        values: SIZING_VALUES
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
    overflow: {
        match: '^overflow(?:-x|-y)?:(?:visible|overlay|hidden|scroll|auto|clip|inherit|initial|revert|revert-layer|unset|\\$|var|$values)',
        declare(value, unit) {
            if (this.prefix) {
                switch (this.prefix.slice(-2, -1)) {
                    case 'x':
                        return { 'overflow-x': value + unit }
                    case 'y':
                        return { 'overflow-y': value + unit }
                }
            }
            return { 'overflow': value + unit }
        },
        get order(): number {
            return -1
        }
    },
    overscrollBehavior: {
        match: '^overscroll-behavior(?:-[xy])?:',
        declare(value, unit) {
            switch (this.prefix.slice(-2, -1)) {
                case 'x':
                    return { 'overscroll-behavior-x': value + unit }
                case 'y':
                    return { 'overscroll-behavior-y': value + unit }
                default:
                    return { 'overscroll-behavior': value + unit }
            }
        }
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
            ...BOX_UNDERNEATH,
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
    borderColor: {
        match: '^b(?:[xytblr]|(?:order(?:-(?:left|right|top|bottom))?))?(?:-color)?:(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|currentColor|inherit|$values|$colors))',
        colored: true,
        values: {
            current: 'currentColor'
        },
        declare(value, unit) {
            return declareBorderRelated(this.prefix, value + unit, 'color')
        },
        get order(): number {
            return (this.prefix === 'border-color' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
        }
    },
    borderRadius: {
        match: '^(?:r[tblr]?[tblr]?|border(?:-(?:top|bottom)-(?:left|right))?-radius):.',
        unit: 'rem',
        declare(value, unit) {
            if (this.prefix) {
                let suffix = ''
                const splits = this.prefix.split('-')
                if (splits.length > 1) {
                    for (let i = 1; i < splits.length - 1; i++) {
                        suffix += splits[i][0]
                    }
                } else {
                    suffix = this.prefix.slice(1, -1)
                }
                switch (suffix) {
                    case 't':
                        return {
                            'border-top-left-radius': value + unit,
                            'border-top-right-radius': value + unit
                        }
                    case 'tl':
                    case 'lt':
                        return {
                            'border-top-left-radius': value + unit
                        }
                    case 'rt':
                    case 'tr':
                        return {
                            'border-top-right-radius': value + unit
                        }
                    case 'b':
                        return {
                            'border-bottom-left-radius': value + unit,
                            'border-bottom-right-radius': value + unit
                        }
                    case 'bl':
                    case 'lb':
                        return {
                            'border-bottom-left-radius': value + unit
                        }
                    case 'br':
                    case 'rb':
                        return {
                            'border-bottom-right-radius': value + unit
                        }
                    case 'l':
                        return {
                            'border-top-left-radius': value + unit,
                            'border-bottom-left-radius': value + unit
                        }
                    case 'r':
                        return {
                            'border-top-right-radius': value + unit,
                            'border-bottom-right-radius': value + unit
                        }
                    default:
                        return {
                            'border-radius': value + unit
                        }
                }
            }

            const prefix = this.prefix?.slice(0, -1)
            return {
                [['border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius'].includes(prefix) ? prefix : 'border-radius']: value + unit
            }
        },
        get order(): number {
            return (this.prefix === 'border-radius' + ':' || this.prefix === 'r:') ? -1 : 0
        }
    },
    borderStyle: {
        match: '^(?:border(?:-(?:left|right|top|bottom))?-style:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|))',
        declare(value, unit) {
            return declareBorderRelated(this.prefix, value + unit, 'style')
        },
        get order(): number {
            return (this.prefix === 'border-style' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
        }
    },
    borderWidth: {
        match: '^(?:border(?:-(?:left|right|top|bottom))?-width:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$)',
        unit: 'rem',
        declare(value, unit) {
            return declareBorderRelated(this.prefix, value + unit, 'width')
        },
        get order(): number {
            return (this.prefix === 'border-width' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
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
        native: true
    },
    border: {
        match: '^b(?:[xytblr]?|order(?:-(?:left|right|top|bottom))?):.',
        unit: 'rem',
        colored: true,
        values: {
            current: 'currentColor'
        },
        declare(value, unit) {
            return declareBorderRelated(this.prefix, value + unit)
        },
        get order(): number {
            return (this.prefix === 'border' + ':' || this.prefix === 'b:') ? -2 : -1
        }
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
        values: BOX_UNDERNEATH
    },
    backgroundOrigin: {
        match: '^(?:bg|background):(?:$values)(?!\\|)',
        native: true,
        values: BOX_UNDERNEATH
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
        values: CONTENT_EXTREMA
    },
    gridAutoFlow: {
        match: '^grid-flow:.',
        native: true
    },
    gridAutoRows: {
        values: CONTENT_EXTREMA,
        native: true
    },
    gridTemplateAreas: {
        native: true
    },
    gridTemplateColumns: {
        match: '^grid-template-cols:.',
        native: true,
        unit: 'rem',
        values: CONTENT_EXTREMA
    },
    gridTemplateRows: {
        native: true,
        unit: 'rem',
        values: CONTENT_EXTREMA
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
    gap: {
        match: '^gap(?:-x|-y)?:.',
        unit: 'rem',
        order: -1,
        declare(value, unit) {
            switch (this.prefix[4]) {
                case 'x':
                    return { 'column-gap': value + unit }
                case 'y':
                    return { 'row-gap': value + unit }
                default:
                    return { gap: value + unit }
            }
        }
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
    scrollMargin: {
        match: '^scroll-m(?:[xytblr]|argin(?:-(?:top|bottom|left|right))?)?:.',
        unit: 'rem',
        declare(value, unit) {
            if (this.prefix.slice(-3, -2) === 'm') {
                switch (this.prefix.slice(-2, -1)) {
                    case 'x':
                        return {
                            'scroll-margin-left': value + unit,
                            'scroll-margin-right': value + unit
                        }
                    case 'y':
                        return {
                            'scroll-margin-top': value + unit,
                            'scroll-margin-bottom': value + unit
                        }
                    case 'l':
                        return {
                            'scroll-margin-left': value + unit
                        }
                    case 'r':
                        return {
                            'scroll-margin-right': value + unit
                        }
                    case 't':
                        return {
                            'scroll-margin-top': value + unit
                        }
                    case 'b':
                        return {
                            'scroll-margin-bottom': value + unit
                        }
                }
            } else {
                return {
                    [this.prefix.replace(/-m(?!argin)/, '-' + 'margin').slice(0, -1)]: value + unit
                }
            }
        },
        get order(): number {
            return (this.prefix === 'scroll-margin:' || this.prefix === 'scroll-m:') ? -1 : 0
        }
    },
    scrollPadding: {
        match: '^scroll-p(?:[xytblr]|adding(?:-(?:top|bottom|left|right))?)?:.',
        unit: 'rem',
        declare(value, unit) {
            if (this.prefix.slice(-3, -2) === 'p') {

                switch (this.prefix.slice(-2, -1)) {
                    case 'x':
                        return {
                            'scroll-padding-left': value + unit,
                            'scroll-padding-right': value + unit
                        }
                    case 'y':
                        return {
                            'scroll-padding-top': value + unit,
                            'scroll-padding-bottom': value + unit
                        }
                    case 'l':
                        return {
                            'scroll-padding-left': value + unit
                        }
                    case 'r':
                        return {
                            'scroll-padding-right': value + unit
                        }
                    case 't':
                        return {
                            'scroll-padding-top': value + unit
                        }
                    case 'b':
                        return {
                            'scroll-padding-bottom': value + unit
                        }
                }
            } else {
                return {
                    [this.prefix.replace(/-p(?!adding)/, '-' + 'padding').slice(0, -1)]: value + unit
                }
            }
        },
        get order(): number {
            return (this.prefix === 'scroll-padding:' || this.prefix === 'scroll-p:') ? -1 : 0
        }
    },
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
            ...BOX_UNDERNEATH,
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
            ...BOX_UNDERNEATH,
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

export const rules = defaultRules as any as { [key in keyof typeof defaultRules]: RuleConfig } & { [key: string]: RuleConfig }

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
                    text: `@keyframes ${eachKeyframeName} {`
                        + Object
                            .entries(config.keyframes[eachKeyframeName])
                            .map(([key, values]) => `${key} {${Object.entries(values).map(([name, value]) => name + ': ' + value).join(';')}}`)
                            .join(',')
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

function declareSpacing(declaration) {
    if (this.prefix.includes('-'))
        return {
            [this.prefix.slice(0, -1)]: declaration
        }

    const charAt1 = this.prefix[0]
    const SPACING = charAt1 === 'm' ? 'margin' : 'padding'
    const SPACING_LEFT = SPACING + '-left'
    const SPACING_RIGHT = SPACING + '-right'
    const SPACING_TOP = SPACING + '-top'
    const SPACING_BOTTOM = SPACING + '-bottom'
    switch (this.prefix[1]) {
        case 'x':
            return {
                [SPACING_LEFT]: declaration,
                [SPACING_RIGHT]: declaration
            }
        case 'y':
            return {
                [SPACING_TOP]: declaration,
                [SPACING_BOTTOM]: declaration
            }
        case 'l':
            return {
                [SPACING_LEFT]: declaration
            }
        case 'r':
            return {
                [SPACING_RIGHT]: declaration
            }
        case 't':
            return {
                [SPACING_TOP]: declaration
            }
        case 'b':
            return {
                [SPACING_BOTTOM]: declaration
            }
        default:
            return {
                [SPACING]: declaration
            }
    }
}

function declareBorderRelated(name: string, declaration, suffix = '') {
    const BORDER_DASH = 'border-'
    if (suffix) {
        suffix = '-' + suffix
    }
    const direction = /^b(order)?-?(.)?/.exec(name)[2]
    const BORDER_LEFT = BORDER_DASH + 'left' + suffix
    const BORDER_RIGHT = BORDER_DASH + 'right' + suffix
    const BORDER_TOP = BORDER_DASH + 'top' + suffix
    const BORDER_BOTTOM = BORDER_DASH + 'bottom' + suffix
    switch (direction) {
        case 'x':
            return {
                [BORDER_LEFT]: declaration,
                [BORDER_RIGHT]: declaration
            }
        case 'y':
            return {
                [BORDER_TOP]: declaration,
                [BORDER_BOTTOM]: declaration
            }
        case 'l':
            return {
                [BORDER_LEFT]: declaration
            }
        case 'r':
            return {
                [BORDER_RIGHT]: declaration
            }
        case 't':
            return {
                [BORDER_TOP]: declaration
            }
        case 'b':
            return {
                [BORDER_BOTTOM]: declaration
            }
        default:
            return {
                ['border' + suffix]: declaration
            }
    }
}