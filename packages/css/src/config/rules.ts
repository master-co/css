import { analyzeValueToken } from '../utils/analyze-value-token'
import { getBorderProps } from '../utils/get-border-props'
import { parseValueUnit } from '../utils/parse-value-unit'
import { START_SYMBOL } from '../constants/start-symbol'
import type { Declaration, Rule, RuleConfig } from '../rule'
import type { MasterCSS } from '../css'

// TODO 於 index.node.ts 引入且防止被樹搖，目前被視為無副作用並被清除
import '../polyfills/css-escape'
import { cssEscape } from '../utils/css-escape'

export const rules: Record<string, RuleConfig> = {
    group: {
        matches: '^(?:.+?[*_>~+])?\\{.+?\\}',
        unit: '',
        prop: false,
        analyzeToken(token: string, values: Record<string, string | number>, globalValues: Record<string, string | number>): [string, Array<string | { value: string }>, string] {
            let i = 0
            for (; i < token.length; i++) {
                if (token[i] === '{' && token[i - 1] !== '\\') {
                    break
                }
            }

            return [token.slice(0, i), ...analyzeValueToken(token.slice(i), values, globalValues)]
        },
        getThemeProps(declaration: Declaration, css: MasterCSS): Record<string, Record<string, string>> {
            const themePropsMap: Record<string, Record<string, string>> = {}

            const addProp = (theme: string, propertyName: string) => {
                const indexOfColon = propertyName.indexOf(':')
                if (indexOfColon !== -1) {
                    if (!(theme in themePropsMap)) {
                        themePropsMap[theme] = {}
                    }

                    const props = themePropsMap[theme]
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
                for (; i < declaration.value.length; i++) {
                    const char = declaration.value[i]

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
                const result = css.create(eachName)
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

            return themePropsMap
        }
    },
    variable: {
        matches: '^\\$[^ (){}A-Z]+:[^ ]',
        unit: '', // don't use 'rem' as default, because css variable is common API
        prop: false,
        get(declaration): { [key: string]: any } {
            return {
                ['--' + this.prefix.slice(1, -1)]: declaration
            }
        }
    },
    fontSize: {
        matches: '^f(?:ont)?:(?:[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
    },
    fontWeight: {
        matches: '^f(?:ont)?:(?:bolder|$values)(?!\\|)',
        unit: ''
    },
    fontFamily: {
        matches: '^f(?:ont)?:(?:$values)(?!\\|)'
    },
    fontSmoothing: {
        matches: '^f(?:ont)?:(?:antialiased|subpixel-antialiased|$values)(?!\\|)',
        unit: '',
        prop: false,
        get(declaration): { [key: string]: any } {
            const props = {}
            switch (declaration.value) {
                case 'subpixel-antialiased':
                    props['-webkit-font-smoothing'] = props['-moz-osx-font-smoothing'] = {
                        ...declaration,
                        value: 'auto'
                    }
                    break
                case 'antialiased':
                    props['-webkit-font-smoothing'] = {
                        ...declaration,
                        value: 'antialiased'
                    }
                    props['-moz-osx-font-smoothing'] = {
                        ...declaration,
                        value: 'grayscale'
                    }
                    break
                // default:
                //     props[WEBKIT_FONT_SMOOTHING] = props[MOZ_OSXFONT_SMOOTHING] = this;
            }
            return props
        }
    },
    fontStyle: {
        matches: '^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)',
        unit: 'deg'
    },
    fontVariantNumeric: {
        matches: '^f(?:ont)?:(?:ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions|$values)(?!\\|)'
    },
    fontFeatureSettings: {
        matches: '^font-feature:.'
    },
    font: {
        matches: '^f:.',
        unit: '',
        order: -1
    },
    color: {
        matches: '^(?:color|fg|foreground):.',
        colorful: true,
        unit: ''
    },
    spacing: {
        matches: '^[pm][xytblr]?:.',
        prop: false,
        get(declaration): { [key: string]: any } {
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
        },
        get order(): number {
            return (this.prefix === 'p:' || this.prefix === 'm:') ? -1 : 0
        }
    },
    margin: {
        matches: '^margin(?:-(?:left|right|top|bottom))?:.',
        prop: false,
        get(declaration): { [key: string]: any } {
            return {
                [this.prefix.slice(0, -1)]: declaration
            }
        },
        get order(): number {
            return (this.prefix === 'margin' + ':') ? -1 : 0
        }
    },
    padding: {
        matches: '^padding(?:-(?:left|right|top|bottom))?:.',
        prop: false,
        get(declaration): { [key: string]: any } {
            return {
                [this.prefix.slice(0, -1)]: declaration
            }
        },
        get order(): number {
            return (this.prefix === 'padding' + ':') ? -1 : 0
        }
    },
    flexBasis: {},
    flexWrap: {
        matches: '^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)'
    },
    flexGrow: {
        unit: ''
    },
    flexShrink: {
        unit: ''
    },
    flexDirection: {
        matches: '^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)'
    },
    flex: {
        unit: '',
        order: -1
    },
    display: {
        matches: '^d:.'
    },
    width: {
        matches: '^w:.'
    },
    height: {
        matches: '^h:.'
    },
    minWidth: {
        matches: '^min-w:.'
    },
    minHeight: {
        matches: '^min-h:.'
    },
    wH: {
        matches: '^(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)',
        prop: false,
        analyzeToken(token: string, values: Record<string, string | number>, globalValues: Record<string, string | number>): [string, Array<string | { value: string }>, string] {
            return ['', ...analyzeValueToken(token, values, globalValues, ['x'])]
        },
        get(declaration): { [key: string]: any } {
            const [width, height] = declaration.value.split(' x ')
            return {
                'width': { ...declaration, value: width },
                'height': { ...declaration, value: height }
            }
        }
    },
    minWH: {
        matches: '^min:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)',
        prop: false,
        analyzeToken(token: string, values: Record<string, string | number>, globalValues: Record<string, string | number>): [string, Array<string | { value: string }>, string] {
            return ['', ...analyzeValueToken(token.slice(4), values, globalValues, ['x'])]
        },
        get(declaration): { [key: string]: any } {
            const [width, height] = declaration.value.split(' x ')
            return {
                'min-width': { ...declaration, value: width },
                'min-height': { ...declaration, value: height }
            }
        }
    },
    maxWH: {
        matches: '^max:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)',
        prop: false,
        analyzeToken(token: string, values: Record<string, string | number>, globalValues: Record<string, string | number>): [string, Array<string | { value: string }>, string] {
            return ['', ...analyzeValueToken(token.slice(4), values, globalValues, ['x'])]
        },
        get(declaration): { [key: string]: any } {
            const [width, height] = declaration.value.split(' x ')
            return {
                'max-width': { ...declaration, value: width },
                'max-height': { ...declaration, value: height }
            }
        }
    },
    contain: {},
    content: {},
    counterIncrement: {
        unit: ''
    },
    counterReset: {
        unit: ''
    },
    letterSpacing: {
        matches: '^ls:.',
        unit: 'em'
    },
    lineHeight: {
        matches: '^lh:.',
        unit: ''
    },
    objectFit: {
        matches: '^(?:object|obj):(?:contain|cover|fill|scale-down|$values)'
    },
    objectPosition: {
        matches: '^(?:object|obj):(?:top|bottom|right|left|center|$values)'
    },
    textAlign: {
        matches: '^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)'
    },
    textDecorationColor: {
        colorStarts: 'text-decoration:',
        colorful: true
    },
    textDecorationStyle: {
        matches: '^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)'
    },
    textDecorationThickness: {
        matches: '^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$',
        unit: 'em'
    },
    textDecorationLine: {
        matches: '^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)'
    },
    textDecoration: {
        matches: '^t(?:ext)?:(?:underline|line-through|overline|$values)',
        colorful: true,
        order: -1
    },
    textUnderlineOffset: {},
    textOverflow: {
        matches: '^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))'
    },
    textOrientation: {
        matches: '^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)'
    },
    textTransform: {
        matches: '^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)'
    },
    textRendering: {
        matches: '^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)'
    },
    textIndent: {},
    verticalAlign: {
        matches: '^(?:v|vertical):.'
    },
    columns: {
        matches: '^(?:columns|cols):.',
        unit: '',
        order: -1
    },
    whiteSpace: {
        unit: ''
    },
    inset: {
        matches: '^(?:top|bottom|left|right):.',
        get(declaration): { [key: string]: any } {
            return {
                [this.prefix.slice(0, -1)]: declaration
            }
        }
    },
    lines: {
        matches: '^lines:.',
        unit: '',
        prop: false,
        get(declaration): { [key: string]: any } {
            return {
                overflow: { ...declaration, value: 'hidden' },
                display: { ...declaration, value: '-webkit-box' },
                'overflow-wrap': { ...declaration, value: 'break-word' },
                'text-overflow': { ...declaration, value: 'ellipsis' },
                '-webkit-box-orient': { ...declaration, value: 'vertical' },
                '-webkit-line-clamp': declaration
            }
        }
    },
    maxHeight: {
        matches: '^max-h:.'
    },
    maxWidth: {
        matches: '^max-w:.'
    },
    boxSizing: {
        matches: '^box:(?:$values)(?!\\|)'
    },
    opacity: {
        unit: ''
    },
    visibility: {},
    clear: {},
    float: {},
    isolation: {},
    overflow: {
        matches: '^overflow(?:-x|-y)?:(?:visible|overlay|hidden|scroll|auto|clip|inherit|initial|revert|revert-layer|unset|\\$|var|$values)',
        prop: false,
        get(declaration): { [key: string]: any } {
            if (this.prefix) {
                switch (this.prefix.slice(-2, -1)) {
                    case 'x':
                        return { 'overflow-x': declaration }
                    case 'y':
                        return { 'overflow-y': declaration }
                }
            }
            return { 'overflow': declaration }
        },
        get order(): number {
            if (this.prefix) {
                switch (this.prefix.slice(-2, -1)) {
                    case 'x':
                    case 'y':
                        return 0
                }
            }
            return -1
        }
    },
    overscrollBehavior: {
        matches: '^overscroll-behavior(?:-[xy])?:',
        prop: false,
        get(declaration): { [key: string]: any } {
            switch (this.prefix.slice(-2, -1)) {
                case 'x':
                    return { 'overscroll-behavior-x': declaration }
                case 'y':
                    return { 'overscroll-behavior-y': declaration }
                default:
                    return { 'overscroll-behavior': declaration }
            }
        }
    },
    zIndex: {
        matches: '^z:.',
        unit: ''
    },
    position: {},
    cursor: {},
    pointerEvents: {},
    resize: {},
    touchAction: {},
    wordBreak: {
        unit: ''
    },
    wordSpacing: {
        unit: 'em'
    },
    userDrag: {
        get(declaration): { [key: string]: any } {
            return {
                'user-drag': declaration,
                '-webkit-user-drag': declaration
            }
        }
    },
    userSelect: {
        get(declaration): { [key: string]: any } {
            return {
                'user-select': declaration,
                '-webkit-user-select': declaration
            }
        }
    },
    textShadow: {
        colorful: true
    },
    textSize: {
        matches: '^t(?:ext)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$',
        prop: false,
        get(declaration): { [key: string]: any } {
            const { unit, value } = declaration
            const diff = .75
            return {
                'font-size': declaration,
                'line-height': {
                    ...declaration,
                    value: unit === 'em'
                        ? value + diff + unit
                        : `calc(${value}${unit} + ${diff}em)`,
                    unit: ''
                }
            }
        }
    },
    textFillColor: {
        matches: '^text-fill-color:.',
        colorStarts: '(?:text-fill|text|t):',
        colorful: true,
        prop: false,
        get(declaration): { [key: string]: any } {
            return {
                '-webkit-text-fill-color': declaration
            }
        }
    },
    textStrokeWidth: {
        matches: '^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)',
        prop: false,
        get(declaration): { [key: string]: any } {
            return {
                '-webkit-text-stroke-width': declaration
            }
        }
    },
    textStrokeColor: {
        matches: '^text-stroke-color:.',
        colorStarts: 'text-stroke:',
        colorful: true,
        prop: false,
        get(declaration): { [key: string]: any } {
            return {
                '-webkit-text-stroke-color': declaration
            }
        }
    },
    textStroke: {
        matches: '^text-stroke:.',
        prop: false,
        get(declaration): { [key: string]: any } {
            return {
                '-webkit-text-stroke': declaration
            }
        }
    },
    boxShadow: {
        matches: '^s(?:hadow)?:.',
        colorful: true
    },
    tableLayout: {},
    transformBox: {
        matches: '^transform:(?:$values)(?!\\|)'
    },
    transformStyle: {
        matches: '^transform:(?:flat|preserve-3d|$values)(?!\\|)'
    },
    transformOrigin: {
        matches: '^transform:(?:top|bottom|right|left|center|[0-9]|$values)',
        unit: 'px'
    },
    transform: {
        matches: '^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\\(',
        unit: '',
        parseValue(value: string, { rootSize }): string {
            return value.replace(
                /(translate|scale|skew|rotate|perspective|matrix)(3d|[XYZ])?\((.*?)\)/g,
                (origin, method, type, valueStr: string) => {
                    let unit: string
                    let last: boolean
                    switch (method) {
                        case 'translate':
                            unit = 'rem'
                            break
                        case 'skew':
                            unit = 'deg'
                            break
                        case 'rotate':
                            if (type === '3d') {
                                last = true
                            }
                            unit = 'deg'
                            break
                        default:
                            return origin
                    }

                    const values = valueStr.split(',')
                    return origin.replace(
                        valueStr,
                        values
                            .map((eachValue, i) => {
                                if (!last || values.length - 1 === i) {
                                    const isNaN = Number.isNaN(+eachValue)
                                    return isNaN
                                        ? eachValue
                                        : ((eachValue as any) / (unit === 'rem' ? rootSize : 1))
                                        + unit
                                } else {
                                    return eachValue
                                }
                            })
                            .join(','))
                })
        }
    },
    transitionProperty: {
        matches: '^~property:.'
    },
    transitionTimingFunction: {
        matches: '^~easing:.'
    },
    transitionDuration: {
        matches: '^~duration:.',
        unit: 'ms'
    },
    transitionDelay: {
        matches: '^~delay:.',
        unit: 'ms'
    },
    transition: {
        symbol: '~',
        order: -1
    },
    animationDelay: {
        matches: '^@delay:.',
        unit: 'ms'
    },
    animationDirection: {
        matches: '^@direction:.'
    },
    animationDuration: {
        matches: '^@duration:.',
        unit: 'ms'
    },
    animationFillMode: {
        matches: '^@fill-mode:.'
    },
    animationIterationCount: {
        matches: '^@iteration-count:.',
        unit: ''
    },
    animationName: {
        matches: '^@name:.'
    },
    animationPlayState: {
        matches: '^@play-state:.'
    },
    animationTimingFunction: {
        matches: '^@easing:.'
    },
    animation: {
        symbol: '@',
        unit: '',
        order: -1
    },
    borderColor: {
        matches: '^border(?:-(?:left|right|top|bottom))?-color:.',
        colorStarts: 'b(?:[xytblr]|(?:order(?:-(?:left|right|top|bottom))?))?:',
        colorful: true,
        prop: false,
        get(declaration): { [key: string]: any } {
            return getBorderProps(this.prefix, declaration, 'color')
        },
        get order(): number {
            return (this.prefix === 'border-color' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
        }
    },
    borderRadius: {
        matches: '^(?:r[tblr]?[tblr]?|border(?:-(?:top|bottom)-(?:left|right))?-radius):.',
        prop: false,
        get(declaration): { [key: string]: any } {
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
                            'border-top-left-radius': declaration,
                            'border-top-right-radius': declaration
                        }
                    case 'tl':
                    case 'lt':
                        return {
                            'border-top-left-radius': declaration
                        }
                    case 'rt':
                    case 'tr':
                        return {
                            'border-top-right-radius': declaration
                        }
                    case 'b':
                        return {
                            'border-bottom-left-radius': declaration,
                            'border-bottom-right-radius': declaration
                        }
                    case 'bl':
                    case 'lb':
                        return {
                            'border-bottom-left-radius': declaration
                        }
                    case 'br':
                    case 'rb':
                        return {
                            'border-bottom-right-radius': declaration
                        }
                    case 'l':
                        return {
                            'border-top-left-radius': declaration,
                            'border-bottom-left-radius': declaration
                        }
                    case 'r':
                        return {
                            'border-top-right-radius': declaration,
                            'border-bottom-right-radius': declaration
                        }
                    default:
                        return {
                            'border-radius': declaration
                        }
                }
            }

            const prefix = this.prefix?.slice(0, -1)
            return {
                [['border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius'].includes(prefix) ? prefix : 'border-radius']: declaration
            }
        },
        get order(): number {
            return (this.prefix === 'border-radius' + ':' || this.prefix === 'r:') ? -1 : 0
        }
    },
    borderStyle: {
        matches: '^(?:border(?:-(?:left|right|top|bottom))?-style:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|))',
        prop: false,
        get(declaration): { [key: string]: any } {
            return getBorderProps(this.prefix, declaration, 'style')
        },
        get order(): number {
            return (this.prefix === 'border-style' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
        }
    },
    borderWidth: {
        matches: '^(?:border(?:-(?:left|right|top|bottom))?-width:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$)',
        prop: false,
        get(declaration): { [key: string]: any } {
            return getBorderProps(this.prefix, declaration, 'width')
        },
        get order(): number {
            return (this.prefix === 'border-width' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
        }
    },
    borderCollapse: {
        matches: '^b(?:order)?:(?:collapse|separate|$values)(?!\\|)'
    },
    borderSpacing: {},
    borderImageOutset: {},
    borderImageRepeat: {
        matches: '^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)'
    },
    borderImageSlice: {
        unit: ''
    },
    borderImageSource: {
        matches: '^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)'
    },
    borderImageWidth: {
        matches: '^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
    },
    borderImage: {
        unit: ''
    },
    border: {
        matches: '^b(?:[xytblr]?|order(?:-(?:left|right|top|bottom))?):.',
        colorful: true,
        prop: false,
        get(declaration): { [key: string]: any } {
            return getBorderProps(this.prefix, declaration)
        },
        get order(): number {
            return (this.prefix === 'border' + ':' || this.prefix === 'b:') ? -2 : -1
        }
    },
    backgroundAttachment: {
        matches: '^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)'
    },
    backgroundBlendMode: {},
    backgroundColor: {
        colorStarts: '(?:bg|background):',
        unit: '',
        colorful: true
    },
    backgroundClip: {
        matches: '^(?:bg|background):(?:text|$values)(?!\\|)',
        get(declaration): { [key: string]: any } {
            return {
                '-webkit-background-clip': declaration,
                'background-clip': declaration
            }
        }
    },
    backgroundOrigin: {
        matches: '^(?:bg|background):(?:$values)(?!\\|)'
    },
    backgroundPosition: {
        matches: '^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)',
        unit: 'px'
    },
    backgroundRepeat: {
        matches: '^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])'
    },
    backgroundSize: {
        matches: '^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)'
    },
    backgroundImage: {
        matches: '^(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)',
        colorful: true
    },
    background: {
        matches: '^bg:.',
        colorful: true,
        order: -1
    },
    mixBlendMode: {
        matches: '^blend:.'
    },
    backdropFilter: {
        matches: '^bd:.',
        colorful: true,
        get(declaration): { [key: string]: any } {
            return {
                'backdrop-filter': declaration,
                '-webkit-backdrop-filter': declaration
            }
        },
        parseValue(value: string, config): string {
            return parseValueUnit(
                value,
                method => {
                    switch (method) {
                        case 'blur':
                        case 'drop-shadow':
                            return 'rem'
                        case 'hue-rotate':
                            return 'deg'
                    }
                    return ''
                },
                config)
        }
    },
    filter: {
        matches: '^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\\(',
        colorful: true,
        parseValue(value: string, config): string {
            return parseValueUnit(
                value,
                method => {
                    switch (method) {
                        case 'blur':
                        case 'drop-shadow':
                            return 'rem'
                        case 'hue-rotate':
                            return 'deg'
                    }

                    return ''
                },
                config)
        }
    },
    fill: {
        colorStarts: 'fill:',
        colorful: true
    },
    strokeDasharray: {},
    strokeDashoffset: {},
    strokeWidth: {
        matches: '^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
    },
    stroke: {
        colorful: true
    },
    x: {
        unit: ''
    },
    y: {
        unit: ''
    },
    cx: {
        unit: ''
    },
    cy: {
        unit: ''
    },
    rx: {
        unit: ''
    },
    ry: {
        unit: ''
    },
    gridColumnStart: {
        matches: '^grid-col-start:.',
        unit: ''
    },
    gridColumnEnd: {
        matches: '^grid-col-end:.',
        unit: ''
    },
    gridColumn: {
        matches: '^grid-col(?:umn)?(?:-span)?:.',
        unit: '',
        order: -1,
        parseValue(value: string): string {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    },
    gridColumns: {
        matches: '^grid-cols:.',
        unit: '',
        get(declaration): { [key: string]: any } {
            return {
                display: { ...declaration, value: 'grid' },
                'grid-template-columns': {
                    ...this,
                    value: 'repeat'
                        + '(' + declaration.value
                        + ','
                        + 'minmax'
                        + '(' + 0 + ',' + 1 + 'fr' + '))'
                },
            }
        }
    },
    gridRowStart: {
        unit: ''
    },
    gridRowEnd: {
        unit: ''
    },
    gridRow: {
        matches: '^grid-row-span:.',
        unit: '',
        order: -1,
        parseValue(value: string): string {
            return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
                ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
                : value
        }
    },
    gridRows: {
        unit: '',
        get(declaration): { [key: string]: any } {
            return {
                display: { ...declaration, value: 'grid' },
                'grid-auto-flow': { ...declaration, value: 'column' },
                'grid-template-rows': {
                    ...declaration,
                    value: 'repeat'
                        + '(' + declaration.value
                        + ','
                        + 'minmax'
                        + '(' + 0 + ',' + 1 + 'fr' + '))'
                },
            }
        }
    },
    gridAutoColumns: {
        matches: '^grid-auto-cols:.'
    },
    gridAutoFlow: {
        matches: '^grid-flow:.'
    },
    gridAutoRows: {},
    gridTemplateAreas: {},
    gridTemplateColumns: {
        matches: '^grid-template-cols:.'
    },
    gridTemplateRows: {},
    gridTemplate: {
        order: -1
    },
    gridArea: {
        unit: '',
        order: -1
    },
    grid: {
        order: -1
    },
    gap: {
        matches: '^gap(?:-x|-y)?:.',
        order: -1,
        prop: false,
        get(declaration): { [key: string]: any } {
            switch (this.prefix[4]) {
                case 'x':
                    return { 'column-gap': declaration }
                case 'y':
                    return { 'row-gap': declaration }
                default:
                    return { gap: declaration }
            }
        }
    },
    order: {
        matches: '^o:.',
        unit: ''
    },
    breakInside: {},
    breakBefore: {},
    breakAfter: {},
    boxDecorationBreak: {
        matches: '^box:(?:slice|clone|$values)(?!\\|)',
        get(declaration): { [key: string]: any } {
            return {
                'box-decoration-break': declaration,
                '-webkit-box-decoration-break': declaration
            }
        }
    },
    aspectRatio: {
        matches: '^aspect:.',
        unit: ''
    },
    columnSpan: {
        matches: '^col-span:.'
    },
    alignContent: {
        matches: '^ac:.'
    },
    alignItems: {
        matches: '^ai:.'
    },
    alignSelf: {
        matches: '^as:'
    },
    justifyContent: {
        matches: '^jc:.'
    },
    justifyItems: {
        matches: '^ji:.'
    },
    justifySelf: {
        matches: '^js:.'
    },
    placeContent: {
        order: -1
    },
    placeItems: {
        order: -1
    },
    placeSelf: {
        order: -1
    },
    listStylePosition: {
        matches: '^list-style:(?:inside|outside|$values)(?!\\|)'
    },
    listStyleType: {
        matches: '^list-style:(?:disc|decimal|$values)(?!\\|)'
    },
    listStyleImage: {
        matches: '^list-style:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)'
    },
    listStyle: {
        order: -1
    },
    outlineColor: {
        colorStarts: 'outline:',
        colorful: true
    },
    outlineOffset: {},
    outlineStyle: {
        matches: '^outline:(?:none|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)'
    },
    outlineWidth: {
        matches: '^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
    },
    outline: {
        order: -1,
        colorful: true
    },
    accentColor: {
        colorStarts: 'accent:',
        colorful: true
    },
    appearance: {},
    caretColor: {
        colorStarts: 'caret:',
        colorful: true
    },
    scrollBehavior: {},
    scrollMargin: {
        matches: '^scroll-m(?:[xytblr]|argin(?:-(?:top|bottom|left|right))?)?:.',
        prop: false,
        get(declaration): { [key: string]: any } {
            if (this.prefix.slice(-3, -2) === 'm') {
                switch (this.prefix.slice(-2, -1)) {
                    case 'x':
                        return {
                            'scroll-margin-left': declaration,
                            'scroll-margin-right': declaration
                        }
                    case 'y':
                        return {
                            'scroll-margin-top': declaration,
                            'scroll-margin-bottom': declaration
                        }
                    case 'l':
                        return {
                            'scroll-margin-left': declaration
                        }
                    case 'r':
                        return {
                            'scroll-margin-right': declaration
                        }
                    case 't':
                        return {
                            'scroll-margin-top': declaration
                        }
                    case 'b':
                        return {
                            'scroll-margin-bottom': declaration
                        }
                }
            } else {
                return {
                    [this.prefix.replace(/-m(?!argin)/, '-' + 'margin').slice(0, -1)]: declaration
                }
            }
        },
        get order(): number {
            return (this.prefix === 'scroll-margin:' || this.prefix === 'scroll-m:') ? -1 : 0
        }
    },
    scrollPadding: {
        matches: '^scroll-p(?:[xytblr]|adding(?:-(?:top|bottom|left|right))?)?:.',
        prop: false,
        get(declaration): { [key: string]: any } {
            if (this.prefix.slice(-3, -2) === 'p') {

                switch (this.prefix.slice(-2, -1)) {
                    case 'x':
                        return {
                            'scroll-padding-left': declaration,
                            'scroll-padding-right': declaration
                        }
                    case 'y':
                        return {
                            'scroll-padding-top': declaration,
                            'scroll-padding-bottom': declaration
                        }
                    case 'l':
                        return {
                            'scroll-padding-left': declaration
                        }
                    case 'r':
                        return {
                            'scroll-padding-right': declaration
                        }
                    case 't':
                        return {
                            'scroll-padding-top': declaration
                        }
                    case 'b':
                        return {
                            'scroll-padding-bottom': declaration
                        }
                }
            } else {
                return {
                    [this.prefix.replace(/-p(?!adding)/, '-' + 'padding').slice(0, -1)]: declaration
                }
            }
        },
        get order(): number {
            return (this.prefix === 'scroll-padding:' || this.prefix === 'scroll-p:') ? -1 : 0
        }
    },
    scrollSnapAlign: {
        matches: '^scroll-snap:(?:start|end|center|$values)'
    },
    scrollSnapStop: {
        matches: '^scroll-snap:(?:normal|always|$values)(?!\\|)'
    },
    scrollSnapType: {
        matches: '^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)'
    },
    willChange: {},
    writingMode: {
        matches: '^writing:.'
    },
    direction: {},
    shapeOutside: {
        matches: '^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)'
    },
    shapeMargin: {
        matches: '^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
    },
    shapeImageThreshold: {
        unit: ''
    },
    clipPath: {
        matches: '^clip:.'
    },
    quotes: {},
    maskImage: {
        get(declaration): { [key: string]: any } {
            return {
                'mask-image': declaration,
                '-webkit-mask-image': declaration
            }
        }
    }
}
