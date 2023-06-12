import { extend } from '@techor/extend'
import { Rule, RuleMeta, RuleNative } from './rule'
import type { Config } from './config'
import { config as defaultConfig } from './config'
import { rgbToHex } from './utils/rgb-to-hex'
import { SELECTOR_SYMBOLS } from './constants/selector-symbols'

const hasWindow = typeof window !== 'undefined'

const createStyle = () => {
    const style = document.createElement('style')
    style.id = 'master'
    return style
}

export interface MasterCSS {
    readonly style: HTMLStyleElement
    readonly host: Element
    readonly root: Document | ShadowRoot
    semantics: [RegExp, [string, string | Record<string, string>]][]
    classes: Record<string, string[]>
    colorThemesMap: Record<string, Record<string, string>>
    colorNames: string[]
    themeNames: string[]
    themeAffectedClassesBy: Record<string, Record<string, string[]>>
    classesBy: Record<string, string[]>
    selectors: Record<string, [RegExp, string[]][]>
    values: Record<string, Record<string, string | number>>
    globalValues: Record<string, string | number>
    breakpoints: Record<string, number>
    mediaQueries: Record<string, string>
    matches: Record<string, RegExp>
    keyframes: Record<string, {
        native: RuleNative
        count: number
    }>
}

export class MasterCSS {

    static root: MasterCSS
    static config: Config = defaultConfig
    static instances: MasterCSS[] = []
    static refresh = (config: Config) => {
        for (const eachInstance of this.instances) {
            eachInstance.refresh(config)
        }
    }

    readonly rules: Rule[] = []
    readonly ruleBy: Record<string, Rule> = {}
    readonly countBy = {}
    readonly observing = false

    observer: MutationObserver

    constructor(
        public config: Config = defaultConfig
    ) {
        if (!config?.override) {
            const getExtendedConfig = (parentConfig: Config, currentConfig: Config) => {
                const extendedCurrentConfig: Config =  currentConfig.extends?.length
                    ? extend({}, currentConfig, ...currentConfig.extends.map(eachConfig => getExtendedConfig(currentConfig, 'config' in eachConfig ? eachConfig.config : eachConfig)))
                    : currentConfig
                const extendedParentConfig: Config = extend(parentConfig, extendedCurrentConfig)
                if ('keyframes' in extendedCurrentConfig) {
                    Object.assign(extendedParentConfig.keyframes, extendedCurrentConfig.keyframes)
                }
                return extendedParentConfig
            }
            this.config = getExtendedConfig(defaultConfig, config)
        }
        this.cache()
        if (hasWindow && this.config.observe) {
            this.observe(document)
        }
        MasterCSS.instances.push(this)
    }

    cache() {
        this.semantics = []
        this.classes = {}
        this.colorThemesMap = {}
        this.themeAffectedClassesBy = {}
        this.classesBy = {}
        this.colorNames = []
        this.themeNames = ['']
        this.selectors = {}
        this.values = {}
        this.globalValues = {}
        this.breakpoints = {}
        this.mediaQueries = {}
        this.matches = {}
        this.keyframes = {}

        const { semantics, classes, selectors, themes, colors, values, breakpoints, mediaQueries, rules } = this.config

        function escapeString(str) {
            return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        }
        function getFlatData(obj: Record<string, any>, hasObjectValue: boolean, parentKey = '', newData: Record<string, any> = {}) {
            const getCurrenyKey = (key) => key ? (parentKey ? parentKey + '-' : '') + key : parentKey
            const entries = Object.entries(obj)
            const objectEntries = []
            const nonObjectEntries = []
            for (const eachEntry of entries) {
                const value = eachEntry[1];
                ((typeof value === 'object' && !Array.isArray(value)) ? objectEntries : nonObjectEntries).push(eachEntry)
            }

            for (const [key, value] of objectEntries) {
                getFlatData(value, hasObjectValue, getCurrenyKey(key), newData)
            }

            if (hasObjectValue && parentKey) {
                if (nonObjectEntries.length) {
                    newData[parentKey] = nonObjectEntries.reduce((newValue, [key, value]) => {
                        newValue[key] = value
                        return newValue
                    }, {})
                }
            } else {
                for (const [key, value] of nonObjectEntries) {
                    newData[getCurrenyKey(key)] = value
                }
            }

            return newData
        }
        function addNegativeValues(values: Record<string, string | number>) {
            for (const [name, value] of Object.entries(values)) {
                if (/^[0-9]+x$/.test(name) && typeof value === 'number') {
                    values['-' + name] = value * -1
                }
            }
            return values
        }

        if (semantics) {
            for (const [semanticName, semanticValue] of Object.entries(getFlatData(semantics, true))) {
                this.semantics.push([new RegExp('^' + escapeString(semanticName) + '(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)', 'm'), [semanticName, semanticValue]])
            }
        }
        if (selectors) {
            for (const [replacedSelectorText, newSelectorText] of Object.entries(getFlatData(selectors, false))) {
                const regexp = new RegExp(escapeString(replacedSelectorText) + '(?![a-z-])')
                for (const eachNewSelectorText of Array.isArray(newSelectorText) ? newSelectorText : [newSelectorText]) {
                    const vendor = eachNewSelectorText.match(/^::-[a-z]+-/m)?.[0] ?? ''

                    let selectorValues = this.selectors[vendor]
                    if (!selectorValues) {
                        selectorValues = this.selectors[vendor] = []
                    }

                    let currentSelectValue = selectorValues.find(([_valueRegexp]) => _valueRegexp === regexp)
                    if (!currentSelectValue) {
                        currentSelectValue = [regexp, []]
                        selectorValues.push(currentSelectValue)
                    }

                    currentSelectValue[1].push(eachNewSelectorText)
                }
            }
        }
        if (values) {
            this.globalValues = addNegativeValues(getFlatData(values, false))
        }
        if (breakpoints) {
            this.breakpoints = getFlatData(breakpoints, false)
        }
        if (mediaQueries) {
            this.mediaQueries = getFlatData(mediaQueries, false)
        }

        const flattedClasses: Record<string, string> = classes ? getFlatData(classes, false) : {}
        const flattedThemeClasses: Record<string, Record<string, string>> = (themes && !Array.isArray(themes))
            ? Object.entries(themes).filter(([, { classes }]) => classes).reduce((obj, [themeName, { classes }]) => {
                obj[themeName] = getFlatData(classes, false)
                return obj
            }, {})
            : {}
        const semanticNames = [
            ...Object.keys(flattedClasses),
            ...Object.entries(flattedThemeClasses).flatMap(([_, classes]) => Object.keys(classes))
        ]
        const handleSemanticName = (semanticName: string) => {
            if (semanticName in this.classes)
                return

            const currentClass = this.classes[semanticName] = []

            const handleClassNames = (theme: string, className: string | string[]) => {
                if (!className)
                    return

                const classNames: string[] = Array.isArray(className)
                    ? className
                    : className
                        .replace(/(?:\n(?:\s*))+/g, ' ')
                        .trim()
                        .split(' ')
                for (const eachClassName of classNames) {
                    const handle = (className: string) => {
                        if (className in this.themeAffectedClassesBy) {
                            if (theme in this.themeAffectedClassesBy[className]) {
                                this.themeAffectedClassesBy[className][theme].push(semanticName)
                            } else {
                                this.themeAffectedClassesBy[className][theme] = [semanticName]
                            }
                        } else {
                            this.themeAffectedClassesBy[className] = { [theme]: [semanticName] }
                        }

                        if (!currentClass.includes(className)) {
                            currentClass.push(className)
                        }
                    }

                    if (semanticNames.includes(eachClassName)) {
                        handleSemanticName(eachClassName)

                        for (const parentClassName of this.classes[eachClassName]) {
                            handle(parentClassName)
                        }
                    } else {
                        handle(eachClassName)
                    }
                }
            }

            handleClassNames('', flattedClasses?.[semanticName])
            for (const [eachTheme, classes] of Object.entries(flattedThemeClasses)) {
                handleClassNames(eachTheme, classes?.[semanticName])
            }
        }
        for (const eachSemanticName of semanticNames) {
            handleSemanticName(eachSemanticName)
        }

        for (const className in this.themeAffectedClassesBy) {
            const currentRelation = this.classesBy[className] = []
            for (const semanticNames of Object.values(this.themeAffectedClassesBy[className])) {
                for (const eachSemanticName of semanticNames) {
                    if (!currentRelation.includes(eachSemanticName)) {
                        currentRelation.push(eachSemanticName)
                    }
                }
            }
        }

        const mergeColors = (theme: string, originalColors: Record<string, any>) => {
            if (!originalColors)
                return

            const colors = getFlatData(originalColors, true)
            for (const [mainColorName, value] of Object.entries(colors)) {
                const levelMap: Record<string, string> = typeof value === 'string' ? { '': value } : value
                for (const [level, color] of Object.entries(levelMap)) {
                    const colorName = mainColorName + (level ? '-' + level : '')
                    if (colorName in this.colorThemesMap) {
                        this.colorThemesMap[colorName][theme] = color
                    } else {
                        this.colorThemesMap[colorName] = { [theme]: color }
                    }
                }
            }

            for (const colorName in originalColors) {
                if (!this.colorNames.includes(colorName)) {
                    this.colorNames.push(colorName)
                }
            }
        }
        mergeColors('', colors)
        if (themes) {
            if (Array.isArray(themes)) {
                this.themeNames.push(...themes)
            } else {
                for (const eachTheme in themes) {
                    const themeValue = themes[eachTheme]
                    mergeColors(eachTheme, themeValue.colors)
                    this.themeNames.push(eachTheme)
                }
            }
        }

        const colorThemesMapLoop = (func: (colorName: string, themeColorMap: Record<string, string>, theme: string, color: string) => void) => {
            for (const [colorName, themeColorMap] of Object.entries(this.colorThemesMap)) {
                for (const [theme, color] of Object.entries(themeColorMap)) {
                    if (!color.startsWith('#')) {
                        func(colorName, themeColorMap, theme, color)
                    }
                }
            }
        }
        colorThemesMapLoop((colorName, themeColorMap, theme, color) => {
            const result = /^rgba?\( *([0-9]{1,3}) *(?: |,) *([0-9]{1,3}) *(?: |,) *([0-9]{1,3}) *(?:(?:\/|,) *0?(\.[0-9]))?\)$/.exec(color)
            if (result) {
                let hexColor = '#' + rgbToHex(+result[1], +result[2], +result[3])
                if (result[4]) {
                    hexColor += Math.round(255 * +result[4]).toString(16)
                }
                themeColorMap[theme] = hexColor
            }
        })
        colorThemesMapLoop((colorName, themeColorMap, theme, color) => {
            const [replaceColorName, alpha] = color.split('/')
            const replaceThemeColorMap = this.colorThemesMap[replaceColorName]
            if (replaceThemeColorMap) {
                const hexColor = (theme ? replaceThemeColorMap[theme] : undefined) ?? replaceThemeColorMap['']
                themeColorMap[theme] = (alpha
                    ? hexColor.slice(0, 7) + Math.round(255 * +alpha).toString(16)
                    : hexColor)
            } else {
                console.warn(`\`${color}\` doesn't exist in the extended config \`.colors\``)
                delete themeColorMap[theme]

                if (!Object.keys(themeColorMap).length) {
                    delete this.colorThemesMap[colorName]
                }
            }
        })

        if (rules) {
            for (const id in rules) {
                const eachRuleConfig = rules[id]
                const { native, values, colored } = eachRuleConfig
                let match = eachRuleConfig.match
                eachRuleConfig.id = id
                eachRuleConfig.native = native === true ? id.replace(/(?!^)[A-Z]/g, m => '-' + m).toLowerCase() : undefined
                if (values) {
                    this.values[id] = addNegativeValues(getFlatData(values, false))
                }
                if (match) {
                    const valueNames = Object.keys(this.values[id] ?? {})
                    if (match.includes('$values')) {
                        match = valueNames.length
                            ? match.replace(/\$values/, valueNames.join('|'))
                            : match.replace(/(?:\|)?\$values/, '')
                    }
                    if (colored && match.includes('$colors')) {
                        match = this.colorNames.length
                            ? match.replace(/\$colors/, '(?:' + this.colorNames.join('|') + ')' + '(?![0-9A-Za-z])')
                            : match.replace(/(?:\|)?\$colors/, '')
                    }
                    this.matches[id] = new RegExp(match)
                }
            }
        }
    }

    observe(targetRoot: Document | ShadowRoot | null, options: MutationObserverInit = { subtree: true, childList: true }) {
        // prevent repeated observation of the same root element
        if (this.root === targetRoot) {
            return
        }
        if (hasWindow && targetRoot) {
            // @ts-ignore
            this.root = targetRoot
            const isDocumentRoot = targetRoot === document

            if (isDocumentRoot) {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                MasterCSS.root = this
            }

            // @ts-ignore
            this.host = isDocumentRoot ? document.documentElement : (this.root as ShadowRoot).host

            const container = isDocumentRoot ? document.head : targetRoot
            const styleSheets: StyleSheetList = isDocumentRoot ? document.styleSheets : targetRoot.styleSheets
            // @ts-ignore
            for (const sheet of styleSheets) {
                const { ownerNode } = sheet
                if (ownerNode && (ownerNode as HTMLStyleElement).id === 'master') {
                    // @ts-ignore
                    this.style = ownerNode
                    break
                }
            }

            if (this.style) {
                for (let index = 0; index < this.style.sheet.cssRules.length; index++) {
                    const cssRule = this.style.sheet.cssRules[index]
                    if (cssRule.constructor.name === 'CSSKeyframesRule')
                        continue

                    const getRule = (cssRule: any): Rule => {
                        if (cssRule.selectorText) {
                            const selectorTexts = cssRule.selectorText.split(', ')
                            const escapedClassNames = selectorTexts[0].split(' ')

                            for (let i = 0; i < escapedClassNames.length; i++) {
                                const eachSelectorText = escapedClassNames[i]
                                if (eachSelectorText[0] === '.') {
                                    const escapedClassName = eachSelectorText.slice(1)

                                    let className = ''
                                    for (let j = 0; j < escapedClassName.length; j++) {
                                        const char = escapedClassName[j]
                                        const nextChar = escapedClassName[j + 1]

                                        if (char === '\\') {
                                            j++

                                            if (nextChar !== '\\') {
                                                className += nextChar

                                                continue
                                            }
                                        } else if (SELECTOR_SYMBOLS.includes(char)) {
                                            break
                                        }

                                        className += char
                                    }

                                    if (!(className in this.ruleBy) && !(className in this.classes)) {
                                        const currentRule = this.create(className)[0]
                                        if (currentRule)
                                            return currentRule
                                    }
                                }
                            }
                        } else if (cssRule.cssRules) {
                            for (let index = 0; index < cssRule.cssRules.length; index++) {
                                const currentRule = getRule(cssRule.cssRules[index])
                                if (currentRule)
                                    return currentRule
                            }
                        }
                    }
                    const rule = getRule(cssRule)
                    if (rule) {
                        this.rules.push(rule)
                        this.ruleBy[rule.className] = rule

                        for (let i = 0; i < rule.natives.length; i++) {
                            rule.natives[i].cssRule = this.style.sheet.cssRules[index + i]
                        }

                        index += rule.natives.length - 1

                        rule.config.insert?.call(rule)
                    }
                }
            } else {
                // @ts-ignore
                this.style = createStyle()
                container.append(this.style)
            }

            const handleClassList = (classList: DOMTokenList) => {
                classList.forEach((className) => {
                    if (className in this.countBy) {
                        this.countBy[className]++
                    } else {
                        this.countBy[className] = 1

                        this.insert(className)
                    }
                })
            }

            handleClassList(this.host.classList)

            if (options.subtree) {
                /**
                 * 待所有 DOM 結構完成解析後，開始繪製 Rule 樣式
                 */
                this.host
                    .querySelectorAll('[class]')
                    .forEach((element) => handleClassList(element.classList))
            }

            this.observer = new MutationObserver((mutationRecords) => {
                // console.time('css engine');
                const correctionOfClassName = {}
                const attributeMutationRecords: MutationRecord[] = []
                const updatedElements: Element[] = []
                const unchangedElements: Element[] = []

                /**
                * 取得所有深層後代的 class names
                */
                const handleClassNameDeeply = (element: Element, remove: boolean) => {
                    if (remove) {
                        element.classList.forEach(removeClassName)
                    } else {
                        element.classList.forEach(addClassName)
                    }

                    const children = element.children
                    for (let i = 0; i < children.length; i++) {
                        const eachChildren = children[i]
                        if (eachChildren.classList) {
                            updatedElements.push(eachChildren)

                            handleClassNameDeeply(eachChildren, remove)
                        }
                    }
                }

                const addClassName = (className: string) => {
                    if (className in correctionOfClassName) {
                        correctionOfClassName[className]++
                    } else {
                        correctionOfClassName[className] = 1
                    }
                }

                const removeClassName = (className: string) => {
                    if (className in correctionOfClassName) {
                        correctionOfClassName[className]--
                    } else if (className in this.countBy) {
                        correctionOfClassName[className] = -1
                    }
                }

                const handleNodes = (nodes: HTMLCollection, remove: boolean) => {
                    for (let i = 0; i < nodes.length; i++) {
                        const eachNode = nodes[i]
                        if (eachNode.classList && !updatedElements.includes(eachNode) && !unchangedElements.includes(eachNode)) {
                            if (eachNode.isConnected !== remove) {
                                updatedElements.push(eachNode)
                                handleClassNameDeeply(eachNode, remove)
                            } else {
                                unchangedElements.push(eachNode)
                            }
                        }
                    }
                }

                for (let i = 0; i < mutationRecords.length; i++) {
                    const mutationRecord = mutationRecords[i]
                    const { addedNodes, removedNodes, type, target } = mutationRecord
                    if (type === 'attributes') {
                        /**
                         * 防止同樣的 MutationRecord 重複執行
                         * According to this history,
                         * MutationObserver was designed to work that way.
                         * Any call to setAttribute triggers a mutation,
                         * regardless of whether the value is being changed or set to the current value
                         */
                        if (
                            attributeMutationRecords
                                .find((eachAttributeMutationRecord) => eachAttributeMutationRecord.target === target)
                        ) {
                            continue
                        } else {
                            /**
                             * 第一個匹配到的 oldValue 一定是該批變動前的原始狀態值
                             */
                            attributeMutationRecords.push(mutationRecord)
                        }
                    } else {
                        // 先判斷節點新增或移除
                        handleNodes(addedNodes as any, false)

                        // 忽略處理新元素的已刪除子節點
                        if (!target.isConnected || !updatedElements.includes(target as any)) {
                            handleNodes(removedNodes as any, true)
                        }
                    }
                }

                if (!attributeMutationRecords.length && !Object.keys(correctionOfClassName).length) {
                    // console.timeEnd('css engine');
                    return
                }

                for (const { oldValue, target } of attributeMutationRecords) {
                    /**
                     * 如果被操作的元素中包含了屬性變更的目標，
                     * 則將該目標從 existedAttributeMutationTargets 中移除，
                     * 以防止執行接下來的屬性變更處理
                     *
                     * 該批 mutationRecords 中，某個 target 同時有 attribute 及 childList 的變更，
                     * 則以 childList 節點插入及移除的 target.className 為主
                     */
                    const updated = updatedElements.includes(target as Element)
                    const classNames = (target as Element).classList
                    const oldClassNames = oldValue ? oldValue.split(' ') : []
                    if (updated) {
                        if (target.isConnected) {
                            continue
                        } else {
                            for (const oldClassName of oldClassNames) {
                                if (!classNames.contains(oldClassName)) {
                                    removeClassName(oldClassName)
                                }
                            }
                        }
                    } else if (target.isConnected) {
                        classNames.forEach((className) => {
                            if (!oldClassNames.includes(className)) {
                                addClassName(className)
                            }
                        })
                        for (const oldClassName of oldClassNames) {
                            if (!classNames.contains(oldClassName)) {
                                removeClassName(oldClassName)
                            }
                        }
                    }
                }

                for (const className in correctionOfClassName) {
                    const correction = correctionOfClassName[className]
                    const count = (this.countBy[className] || 0) + correction
                    if (count === 0) {
                        // remove
                        delete this.countBy[className]
                        /**
                         * class name 從 DOM tree 中被移除，
                         * 匹配並刪除對應的 rule
                         */
                        this.delete(className)
                    } else {
                        if (!(className in this.countBy)) {
                            // add
                            /**
                             * 新 class name 被 connected 至 DOM tree，
                             * 匹配並創建對應的 Rule
                             */
                            this.insert(className)
                        }

                        this.countBy[className] = count
                    }
                }

                // console.timeEnd('css engine');
            })
            this.observer.observe(targetRoot, {
                ...options,
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ['class'],
            });

            (this.host as HTMLElement).style.display = null
            // @ts-ignore
            this.observing = true
        }
        return this
    }

    disconnect(): void {
        if (this.observer) {
            this.observer.disconnect()
            this.observer = null
        }
        // @ts-ignore
        this.observing = false
        // @ts-ignore
        this.ruleBy = {}
        // @ts-ignore
        this.countBy = {}
        this.rules.length = 0
        const sheet = this.style?.sheet
        if (sheet?.cssRules) {
            for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
                sheet.deleteRule(i)
            }
        }
        this.style?.remove()
        // @ts-ignore
        this.style = null
        // @ts-ignore
        this.root = null
    }

    /**
     * 比對是否為 Master CSS 的類名語法
     */
    match(className: string): RuleMeta {
        for (const id in this.config.rules) {
            const eachRuleConfig = this.config.rules[id]
            const match = this.matches[id]
            const { native } = eachRuleConfig
            /**
             * STEP 1. matches
             */
            if (match && match.test(className)) {
                return { origin: 'match', config: eachRuleConfig }
            }
            /**
             * STEP 2. key full className
             */
            if (native && className.startsWith(native + ':')) {
                return { origin: 'match', config: eachRuleConfig }
            }
        }

        for (const eachSemanticEntry of this.semantics) {
            if (className.match(eachSemanticEntry[0])) {
                return {
                    origin: 'semantics',
                    value: eachSemanticEntry[1]
                }
            }
        }
    }

    /**
     * 透過類名 ( 包含 .classes ) 生成 rules[]
     */
    create(className: string): Rule[] {
        const create = (eachClassName: string) => {
            if (eachClassName in this.ruleBy)
                return this.ruleBy[eachClassName]

            const meta = this.match(eachClassName)
            if (meta) {
                return new Rule(
                    eachClassName,
                    meta,
                    this
                )
            }
        }
        return (
            className in this.classes
                ? this.classes[className].map((eachClassName) => create(eachClassName))
                : [create(className)]
        )
            .filter(eachRule => eachRule && eachRule.text)
    }

    /**
     * 根據蒐集到的所有 DOM class 重新 create
     */
    refresh(config: Config) {
        if (!config?.override) {
            this.config = extend(defaultConfig, config)
        } else {
            this.config = config
        }
        this.cache()

        if (!this.style) {
            return
        }

        const style = createStyle()
        this.style.replaceWith(style)
        // @ts-ignore
        this.style = style
        this.rules.length = 0
        // @ts-ignore
        this.ruleBy = {}

        /**
         * 拿當前所有的 classNames 按照最新的 colors, breakpoints, config.rules 匹配並生成新的 style
         * 所以 refresh 過後 rules 可能會變多也可能會變少
         */
        for (const name in this.countBy) {
            this.insert(name)
        }
    }

    destroy() {
        const instances = MasterCSS.instances
        this.disconnect()
        instances.splice(instances.indexOf(this), 1)
    }

    /**
     * 透過類名來刪除對應的 rules
     */
    delete(className: string) {
        /**
         * class name 從 DOM tree 中被移除，
         * 匹配並刪除對應的 rule
         */
        const sheet = this.style?.sheet
        const deleteRule = (name: string) => {
            const rule = this.ruleBy[name]
            if (
                !rule
                || name in this.classesBy && this.classesBy[name].some(eachClassName => eachClassName in this.countBy)
            )
                return

            if (sheet && rule.natives.length) {
                const firstNative = rule.natives[0]
                for (let index = 0; index < sheet.cssRules.length; index++) {
                    const eachCssRule = sheet.cssRules[index]
                    if (eachCssRule === firstNative.cssRule) {
                        for (let i = 0; i < rule.natives.length; i++) {
                            sheet.deleteRule(index)
                        }
                        break
                    }
                }
            }

            this.rules.splice(this.rules.indexOf(rule), 1)
            delete this.ruleBy[name]

            // keyframes
            if (rule.keyframeNames) {
                const keyframeRule = this.rules[0]
                for (const eachKeyframeName of rule.keyframeNames) {
                    const keyframe = this.keyframes[eachKeyframeName]
                    if (!--keyframe.count) {
                        const nativeIndex = keyframeRule.natives.indexOf(keyframe.native)
                        this.style.sheet.deleteRule(nativeIndex)
                        keyframeRule.natives.splice(nativeIndex, 1)
                        delete this.keyframes[eachKeyframeName]
                    }
                }
        
                if (!keyframeRule.natives.length) {
                    this.rules.splice(0, 1)
                }
            }

            rule.config.delete?.call(rule, name)
        }

        if (className in this.classes) {
            for (const eachClassName of this.classes[className]) {
                if (!(eachClassName in this.countBy)) {
                    deleteRule(eachClassName)
                }
            }

            delete this.ruleBy[className]
        } else {
            deleteRule(className)
        }
    }

    /**
    * 依類名插入規則
     */
    insert(eachClassName: string): boolean {
        const rules = this.create(eachClassName)
        if (rules.length) {
            this.insertRules(rules)
            return true
        } else {
            return false
        }
    }

    /**
    * 加工插入規則
    * 1. where
    * 2. normal
    * 3. where selectors
    * 4. normal selectors
    * 5. media where
    * 6. media normal
    * 7. media where selectors
    * 8. media selectors
    * 9. media width where
    * 10. media width
    * 11. media width where selectors
    * 12. media width selectors
    */
    insertRules(rules: Rule[]) {
        for (const rule of rules) {
            if (this.ruleBy[rule.className])
                continue
            let index
            /**
             * 必須按斷點值遞增，並透過索引插入，
             * 以實現響應式先後套用的規則
             * @example <1  <2  <3  ALL  >=1 >=2 >=3
             * @description
             */
            const hasKeyframeRule = Object.keys(this.keyframes).length
            const endIndex = this.rules.length - 1
            const { media, order, priority, hasWhere, className } = rule

            const findIndex = (startIndex: number, stopCheck: (rule: Rule) => any, matchCheck?: (rule: Rule) => any) => {
                let i = startIndex
                for (; i <= endIndex; i++) {
                    const eachRule = this.rules[i]
                    if (stopCheck?.(eachRule))
                        return matchCheck
                            ? -1
                            : i - 1
                    if (matchCheck?.(eachRule))
                        return i
                }

                return matchCheck
                    ? -1
                    : i - 1
            }

            let matchStartIndex: number
            let matchEndIndex: number
            if (media) {
                const mediaStartIndex = this.rules.findIndex(eachRule => eachRule.media)
                if (mediaStartIndex === -1) {
                    index = endIndex + 1
                } else {
                    const { 'max-width': maxWidthFeature, 'min-width': minWidthFeature } = media.features
                    if (maxWidthFeature || minWidthFeature) {
                        const mediaWidthStartIndex = this.rules.findIndex(eachRule => eachRule.media?.features['max-width'] || eachRule.media?.features['min-width'])
                        if (mediaWidthStartIndex === -1) {
                            index = endIndex + 1
                        } else {
                            if (maxWidthFeature && minWidthFeature) {
                                /**
                                 * 範圍越小 ( 越限定 越侷限 ) 越優先，
                                 * 按照範圍 max-width - min-width 遞減排序
                                 * find 第一個所遇到同樣 feature 且範圍值比自己大的 rule，
                                 * 並插入在該 rule 之後，讓自己優先被套用
                                 */
                                if (priority === -1) {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.priority !== -1,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width']
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.priority !== -1
                                    )
                                } else {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        undefined,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] && eachRule.priority !== -1
                                    )
                                    matchEndIndex = endIndex
                                }

                                if (matchStartIndex !== -1) {
                                    const range = maxWidthFeature.value - minWidthFeature.value

                                    let i = matchEndIndex
                                    const endI = matchStartIndex
                                    matchStartIndex = undefined
                                    for (; i >= endI; i--) {
                                        const { 'max-width': eachMaxWidthFeature, 'min-width': eachMinWidthFeature } = this.rules[i].media.features
                                        const eachRange = eachMaxWidthFeature.value - eachMinWidthFeature.value
                                        if (eachRange < range) {
                                            matchEndIndex = i - 1
                                        } else if (eachRange === range) {
                                            matchStartIndex = i
                                        } else {
                                            break
                                        }
                                    }
                                }

                                if (matchStartIndex !== -1) {
                                    const range = maxWidthFeature.value - minWidthFeature.value
                                    for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                        const { 'max-width': eachMaxWidthFeature, 'min-width': eachMinWidthFeature } = this.rules[i].media.features
                                        const eachRange = eachMaxWidthFeature.value - eachMinWidthFeature.value
                                        if (eachRange < range) {
                                            matchEndIndex = i - 1
                                        } else if (eachRange > range) {
                                            matchStartIndex = i + 1
                                            break
                                        }
                                    }
                                }
                            } else if (minWidthFeature) {
                                /**
                                 * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                                 * 並插入在該 rule 之後，讓自己優先被套用
                                 */
                                if (priority === -1) {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] || eachRule.priority !== -1,
                                        eachRule => !eachRule.media.features['max-width'] && eachRule.media.features['min-width']
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] || eachRule.priority !== -1
                                    )
                                } else {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] && eachRule.priority !== -1,
                                        eachRule => !eachRule.media.features['max-width'] && eachRule.media.features['min-width'] && eachRule.priority !== -1
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] && eachRule.priority !== -1
                                    )
                                }

                                if (matchStartIndex !== -1) {
                                    for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                        const value = this.rules[i].media.features['min-width'].value
                                        if (value > minWidthFeature.value) {
                                            matchEndIndex = i - 1
                                        } else if (value < minWidthFeature.value) {
                                            matchStartIndex = i + 1
                                            break
                                        }
                                    }
                                }
                            } else {
                                /**
                                 * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                                 * 並插入在該 rule 之後，讓自己優先被套用
                                 */
                                if (priority === -1) {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['min-width'] || eachRule.priority !== -1,
                                        eachRule => eachRule.media.features['max-width']
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['min-width'] || eachRule.priority !== -1
                                    )
                                } else {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['min-width'] && eachRule.priority !== -1,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.priority !== -1
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['min-width'] && eachRule.priority !== -1
                                    )
                                }

                                if (matchStartIndex !== -1) {
                                    for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                        const value = this.rules[i].media.features['max-width'].value
                                        if (value < maxWidthFeature.value) {
                                            matchEndIndex = i - 1
                                        } else if (value > maxWidthFeature.value) {
                                            matchStartIndex = i + 1
                                            break
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (priority === -1) {
                            matchStartIndex = mediaStartIndex
                            matchEndIndex = findIndex(
                                mediaStartIndex,
                                eachRule => eachRule.media?.features['max-width'] || eachRule.media?.features['min-width'] || eachRule.priority !== -1
                            )
                        } else {
                            matchStartIndex = findIndex(
                                mediaStartIndex,
                                eachRule => eachRule.media?.features['max-width'] || eachRule.media?.features['min-width'],
                                eachRule => eachRule.priority !== -1
                            )
                            matchEndIndex = findIndex(
                                mediaStartIndex,
                                eachRule => eachRule.media?.features['max-width'] || eachRule.media?.features['min-width']
                            )
                        }
                    }
                }
            } else {
                const findStartIndex = hasKeyframeRule ? 1 : 0

                if (priority === -1) {
                    matchStartIndex = findStartIndex
                    matchEndIndex = findIndex(
                        findStartIndex,
                        eachRule => eachRule.media || eachRule.priority !== -1
                    )
                } else {
                    matchStartIndex = findIndex(
                        findStartIndex,
                        eachRule => eachRule.media,
                        eachRule => eachRule.priority !== -1
                    )
                    matchEndIndex = findIndex(
                        findStartIndex,
                        eachRule => eachRule.media
                    )
                }
            }

            if (index === undefined) {
                if (matchStartIndex === -1) {
                    index = matchEndIndex + 1
                } else {
                    if (priority === -1) {
                        for (let i = matchStartIndex; i <= matchEndIndex; i++) {
                            const currentRule = this.rules[i]
                            if (!hasWhere && currentRule.hasWhere)
                                continue

                            if (
                                hasWhere && !currentRule.hasWhere
                                || currentRule.order >= order
                            ) {
                                index = i
                                break
                            }
                        }
                    } else {
                        for (let i = matchStartIndex; i <= matchEndIndex; i++) {
                            const currentRule = this.rules[i]
                            if (!hasWhere && currentRule.hasWhere)
                                continue

                            if (hasWhere && !currentRule.hasWhere) {
                                index = i
                                break
                            }

                            if (currentRule.priority < priority) {
                                index = i
                                break
                            } else if (currentRule.priority === priority) {
                                if (currentRule.order >= order) {
                                    index = i
                                    break
                                }
                            } else {
                                index = i + 1
                            }
                        }
                    }

                    if (index === undefined) {
                        index = matchEndIndex + 1
                    }
                }
            }

            this.rules.splice(index, 0, rule)
            this.ruleBy[className] = rule

            // 只在瀏覽器端運行
            if (this.style) {
                const sheet = this.style.sheet

                let cssRuleIndex = 0
                const getCssRuleIndex = (index: number) => {
                    const previousRule = this.rules[index]
                    if (previousRule) {
                        if (!previousRule.natives.length)
                            return getCssRuleIndex(index - 1)

                        const lastNativeCssRule = previousRule.natives[previousRule.natives.length - 1].cssRule
                        for (let i = 0; i < sheet.cssRules.length; i++) {
                            if (sheet.cssRules[i] === lastNativeCssRule) {
                                cssRuleIndex = i + 1
                                break
                            }
                        }
                    }
                }
                getCssRuleIndex(index - 1)

                for (let i = 0; i < rule.natives.length;) {
                    try {
                        const native = rule.natives[i]
                        sheet.insertRule(native.text, cssRuleIndex)
                        native.cssRule = sheet.cssRules[cssRuleIndex++]
                        i++
                    } catch (error) {
                        console.error(error)
                        rule.natives.splice(i, 1)
                    }
                }
            }

            // keyframes
            if (rule.keyframeNames) {
                const sheet = this.style?.sheet
                for (const eachKeyframeName of rule.keyframeNames) {
                    if (eachKeyframeName in this.keyframes) {
                        this.keyframes[eachKeyframeName].count++
                    } else {
                        const native: RuleNative = {
                            text: `@keyframes ${eachKeyframeName}{`
                                + Object
                                    .entries(this.config.keyframes[eachKeyframeName])
                                    .map(([key, values]) => `${key}{${Object.entries(values).map(([name, value]) => name + ':' + value).join(';')}}`)
                                    .join('')
                                + '}',
                            theme: ''
                        }
        
                        let keyframeRule: Rule
                        if (Object.keys(this.keyframes).length) {
                            (keyframeRule = this.rules[0]).natives.push(native)
                        } else {
                            this.rules.splice(
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
        
                        this.keyframes[eachKeyframeName] = {
                            native,
                            count: 1
                        }
                    }
                }
            }

            rule.config.insert?.call(rule)
        }
    }

    get text() {
        return this.rules.map((eachRule) => eachRule.text).join('')
    }
}

if (hasWindow) {
    window.MasterCSS = MasterCSS
}

declare global {
    interface Window {
        MasterCSS: typeof MasterCSS
    }
}
