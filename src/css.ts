import { defaultConfig } from './config'
import { init } from './apis/init'
import { MasterCSSConfig } from './interfaces/config'
import { MasterCSSRule } from './rule'

const selectorSymbols = [',', '.', '#', '[', '!', '*', '>', '+', '~', ':', '@']
const vendorPrefixSelectorRegExp = /^::-[a-z]+-/m

const hasDocument = typeof document !== 'undefined'

let STYLE: HTMLStyleElement
if (hasDocument) {
    STYLE = document.createElement('style')
    STYLE.title = 'master'
}
const MAX_WIDTH = 'max-width'
const MIN_WIDTH = 'min-width'
const ATTRIBUTES = 'attributes'

const isBrowser = typeof window !== 'undefined'

const MutationObserver = isBrowser
    ? window.MutationObserver
    : Object

export default class MasterCSS extends MutationObserver {

    static init = init
    static defaultConfig: MasterCSSConfig = defaultConfig
    static instances: MasterCSS[] = []
    static root: MasterCSS

    /**
     * 全部 sheet 根據目前蒐集到的所有 DOM class 重新 findAndNew
     */
    static refresh(config: MasterCSSConfig) {
        for (const eachInstance of this.instances) {
            eachInstance.refresh(config)
        }
    }

    readonly style: HTMLStyleElement
    readonly rules: MasterCSSRule[] = []
    readonly ruleOfClass: Record<string, MasterCSSRule> = {}
    readonly countOfClass = {}
    readonly host: Element

    semantics: [RegExp, string][]
    classes: Record<string, string[]>
    colorsThemesMap: Record<string, Record<string, Record<string, string>>>
    colorNames: string[]
    themeNames: string[]
    relationThemesMap: Record<string, Record<string, string[]>>
    relations: Record<string, string[]>
    selectors: Record<string, [RegExp, string[]][]>

    private schemeMQL: MediaQueryList

    constructor(
        public config: MasterCSSConfig = defaultConfig,
        public root?: Document | ShadowRoot
    ) {
        super((mutationRecords) => {
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
                } else {
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
                const { addedNodes, removedNodes, type, target, oldValue } = mutationRecord
                if (type === ATTRIBUTES) {
                    /**
                     * 防止同樣的 MutationRecord 重複執行
                     * According to this history, 
                     * MutationObserver was designed to work that way. 
                     * Any call to setAttribute triggers a mutation, 
                     * regardless of whether the value is being changed or set to the current value
                     */
                    if (
                        target['className'] === oldValue // prevent same class to execute
                        || attributeMutationRecords
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
                    handleNodes(addedNodes, false)
                    handleNodes(removedNodes, true)
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
                } else {
                    if (target.isConnected) {
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
                    } else {
                        for (const oldClassName of oldClassNames) {
                            removeClassName(oldClassName)
                        }
                    }
                }
            }

            for (const className in correctionOfClassName) {
                const correction = correctionOfClassName[className]
                const count = (this.countOfClass[className] || 0) + correction
                if (count === 0) {
                    // remove
                    delete this.countOfClass[className]
                    /**
                     * class name 從 DOM tree 中被移除，
                     * 匹配並刪除對應的 rule
                     */
                    this.delete(className)
                } else {
                    if (!(className in this.countOfClass)) {
                        // add
                        /**
                         * 新 class name 被 connected 至 DOM tree，
                         * 匹配並創建對應的 Rule
                         */
                        this.findAndInsert(className)
                    }

                    this.countOfClass[className] = count
                }
            }

            // console.timeEnd('css engine');
        })

        this.cache()

        if (hasDocument && root) {
            const isDocumentRoot = root === document
            this.host = isDocumentRoot ? document.documentElement : (root as ShadowRoot).host

            // sync theme
            this.scheme = this.storageScheme || config.scheme.preference

            const container = isDocumentRoot ? document.head : root
            const styleSheets = isDocumentRoot ? document.styleSheets : root.styleSheets
            // @ts-ignore
            for (const sheet of styleSheets) {
                if (sheet.title === 'master') {
                    this.style = sheet.ownerNode
                }
            }
            if (this.style) {
                for (let index = 0; index < this.style.sheet.cssRules.length; index++) {
                    const getRule = (cssRule: any): MasterCSSRule => {
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
                                        } else if (selectorSymbols.includes(char)) {
                                            break
                                        }

                                        className += char
                                    }

                                    if (!(className in this.ruleOfClass) && !(className in this.classes)) {
                                        const currentRule = this.findAndNew(className) as MasterCSSRule
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
                    const rule = getRule(this.style.sheet.cssRules[index])
                    if (rule) {
                        this.rules.push(rule)
                        this.ruleOfClass[rule.className] = rule

                        for (let i = 0; i < rule.natives.length; i++) {
                            rule.natives[i].cssRule = this.style.sheet.cssRules[index + i]
                        }

                        index += rule.natives.length - 1
                    }
                }
            } else {
                this.style = STYLE.cloneNode() as HTMLStyleElement
                /** 使用 prepend 而非 append 去降低 rules 類的優先層級，無法強制排在所有 <style> 之後 */
                container.prepend(this.style)
            }
        }

        MasterCSS.instances.push(this)
    }

    get storageScheme() {
        const { storage } = this.config.scheme
        return localStorage.getItem(storage.key)
    }

    #scheme: string
    #theme: string

    set scheme(scheme: string) {
        if (scheme !== this.#scheme) {
            this.#scheme = scheme
            const { storage } = this.config.scheme
            if (scheme === 'system') {
                // 按照系統的主題切換，目前只支援 light dark
                this.schemeMQL = window.matchMedia('(prefers-color-scheme:dark)')
                this.schemeMQL.addEventListener('change', this.onThemeChange)
                this.theme = this.schemeMQL.matches ? 'dark' : 'light'
            } else {
                this.removeSchemeListener()
                this.theme = scheme
            }
            if (this.storageScheme !== scheme && storage.sync) {
                localStorage.setItem(storage.key, scheme)
            }
        }
    }

    get scheme() {
        return this.#scheme
    }

    set theme(theme: string) {
        if (theme !== this.#theme) {
            if (this.#theme) {
                this.host.classList.remove(this.#theme)
            }
            this.#theme = theme
            if (this.host === document.documentElement) {
                (this.host as HTMLElement).style.colorScheme = theme
            }
            this.host.classList.add(theme)
        }
    }

    get theme() {
        return this.#theme
    }

    private removeSchemeListener() {
        if (this.schemeMQL) {
            this.schemeMQL.removeEventListener('change', this.onThemeChange)
            this.schemeMQL = null
        }
    }

    private onThemeChange(mediaQueryList) {
        this.theme = mediaQueryList.matches ? 'dark' : 'light'
    }

    private cache() {
        this.semantics = []
        this.classes = {}
        this.colorsThemesMap = {}
        this.relationThemesMap = {}
        this.relations = {}
        this.colorNames = []
        this.themeNames = ['']
        this.selectors = {}

        const { semantics, classes, selectors, themes, colors } = this.config

        function escapeString(str) {
            return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        }

        if (semantics) {
            for (const semanticName in semantics) {
                this.semantics.push([new RegExp('^' + escapeString(semanticName) + '(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)', 'm'), semanticName])
            }
        }
        if (selectors) {
            for (const [replacedSelectorText, newSelectorText] of Object.entries(selectors)) {
                const regexp = new RegExp(escapeString(replacedSelectorText) + '(?![a-z-])')
                for (const eachNewSelectorText of Array.isArray(newSelectorText) ? newSelectorText : [newSelectorText]) {
                    const vendor = eachNewSelectorText.match(vendorPrefixSelectorRegExp)?.[0] ?? ''

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


        const semanticNames = [
            ...(classes ? Object.keys(classes) : []),
            ...((themes && !Array.isArray(themes))
                ? Object.entries(themes).flatMap(([_, { classes }]) => classes ? Object.keys(classes) : [])
                : [])
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
                        if (className in this.relationThemesMap) {
                            if (theme in this.relationThemesMap[className]) {
                                this.relationThemesMap[className][theme].push(semanticName)
                            } else {
                                this.relationThemesMap[className][theme] = [semanticName]
                            }
                        } else {
                            this.relationThemesMap[className] = { [theme]: [semanticName] }
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

            handleClassNames('', classes?.[semanticName])
            if (themes && !Array.isArray(themes)) {
                for (const [eachTheme, { classes }] of Object.entries(themes)) {
                    handleClassNames(eachTheme, classes?.[semanticName])
                }
            }
        }
        for (const eachSemanticName of semanticNames) {
            handleSemanticName(eachSemanticName)
        }

        for (const className in this.relationThemesMap) {
            const currentRelation = this.relations[className] = []
            for (const semanticNames of Object.values(this.relationThemesMap[className])) {
                for (const eachSemanticName of semanticNames) {
                    if (!currentRelation.includes(eachSemanticName)) {
                        currentRelation.push(eachSemanticName)
                    }
                }
            }
        }

        const mergeColors = (theme: string, colors: Record<string, string | Record<string, string>>) => {
            if (!colors)
                return

            for (const colorName in colors) {
                let levels = colors[colorName]
                if (typeof levels === 'string') {
                    levels = { '': levels }
                }

                if (colorName in this.colorsThemesMap) {
                    const levelsThemes = this.colorsThemesMap[colorName]
                    for (const level in levels) {
                        const color = levels[level]

                        if (level in levelsThemes) {
                            levelsThemes[level][theme] = color
                        } else {
                            levelsThemes[level] = { [theme]: color }
                        }
                    }
                } else {
                    this.colorNames.push(colorName)
                    this.colorsThemesMap[colorName] = Object
                        .entries(levels)
                        .reduce((obj, [level, color]) => {
                            obj[level] = { [theme]: color }
                            return obj
                        }, {})
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
    }

    observe(options: MutationObserverInit = { subtree: true, childList: true }) {
        if (options.subtree) {
            /**
             * 待所有 DOM 結構完成解析後，開始繪製 MasterCSSRule 樣式
             */
            this.host
                .querySelectorAll('[class]')
                .forEach((element) => {
                    element.classList.forEach((className) => {
                        if (className in this.countOfClass) {
                            this.countOfClass[className]++
                        } else {
                            this.countOfClass[className] = 1

                            this.findAndInsert(className)
                        }
                    })
                })
        }
        super.observe(this.root, {
            ...options,
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['class'],
        })
        return this
    }

    disconnect(): void {
        super.disconnect()
        // @ts-ignore
        this.ruleOfClass = {}
        // @ts-ignore
        this.countOfClass = {}

        this.rules.length = 0

        const sheet = this.style.sheet
        if (sheet) {
            for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
                sheet.deleteRule(i)
            }
        }
    }

    /**
     * 尋找匹配的 MasterCSSRule 生成實例
     */
    findAndNew(name: string) {
        const findAndNewRule = (className: string) => {
            if (className in this.ruleOfClass)
                return this.ruleOfClass[className]

            for (const EachRule of this.config.Rules) {
                const matching = EachRule.match(className, this.colorNames)
                if (matching)
                    return new EachRule(
                        className,
                        matching,
                        this
                    )
            }

            for (const eachSemanticEntry of this.semantics) {
                if (className.match(eachSemanticEntry[0]))
                    return new MasterCSSRule(
                        className,
                        { origin: 'semantics', value: eachSemanticEntry[1] },
                        this
                    )
            }
        }

        return name in this.classes
            ? this.classes[name]
                .map(findAndNewRule)
                .filter(eachRule => eachRule)
            : findAndNewRule(name)
    }

    /**
     * 根據目前蒐集到的所有 DOM class 重新 findAndNew
     */
    refresh(config: MasterCSSConfig) {
        this.config = config
        this.cache()

        if (!this.style) {
            return
        }

        const element = STYLE.cloneNode() as HTMLStyleElement
        this.style.replaceWith(element)
        // @ts-ignore
        this.style = style
        this.rules.length = 0
        // @ts-ignore
        this.ruleOfClass = {}

        /**
         * 拿當前所有的 classNames 按照最新的 colors, breakpoints, config.Rules 匹配並生成新的 style
         * 所以 refresh 過後 rules 可能會變多也可能會變少
         */
        for (const name in this.countOfClass) {
            this.findAndInsert(name)
        }
    }

    destroy() {
        const instances = MasterCSS.instances
        this.disconnect()
        instances.splice(instances.indexOf(this), 1)
        this.style.remove()
        this.removeSchemeListener()
    }

    /**
     * 1. where
     * 2. normal
     * 3. where selectors
     * 4. normal selectors
     * 5. media where
     * 6. media normal
     * 7. media selectors
     * 8. media width where
     * 9. media width
     * 10. media width selectors
     */
    insert(rule: MasterCSSRule) {
        if (this.ruleOfClass[rule.className])
            return

        const { validateRule } = this.config
        if (validateRule && !validateRule(rule, this)) {
            return
        }

        let index
        /**
         * 必須按斷點值遞增，並透過索引插入，
         * 以實現響應式先後套用的規則
         * @example <1  <2  <3  ALL  >=1 >=2 >=3
         * @description
         */
        const endIndex = this.rules.length - 1
        const { media, order, prioritySelectorIndex, hasWhere, className } = rule
        const findPrioritySelectorInsertIndex = (
            rules: MasterCSSRule[],
            findStartIndex?: (rule: MasterCSSRule) => any,
            findEndIndex?: (rule: MasterCSSRule) => any,
            ignoreRule?: (rule: MasterCSSRule) => any
        ) => {
            let sIndex = 0
            let eIndex: number

            // 1. 找尋目標陣列
            if (findStartIndex) {
                sIndex = rules.findIndex(findStartIndex)
            }
            if (findEndIndex) {
                eIndex = rules.findIndex(findEndIndex)
            }
            if (sIndex === -1) {
                sIndex = rules.length
            }
            if (eIndex === undefined || eIndex === -1) {
                eIndex = rules.length
            }

            const targetRules: MasterCSSRule[] = rules.slice(sIndex, eIndex)

            // 2. 由目標陣列找尋插入點
            for (let i = 0; i < targetRules.length; i++) {
                const currentRule = targetRules[i]

                if (currentRule.prioritySelectorIndex === -1 || ignoreRule && ignoreRule(currentRule))
                    continue

                if (
                    currentRule.prioritySelectorIndex < prioritySelectorIndex
                    || currentRule.prioritySelectorIndex === prioritySelectorIndex
                    && (
                        hasWhere && !currentRule.hasWhere
                        || currentRule.order >= order
                    )
                )
                    return sIndex + i

            }

            return sIndex + targetRules.length
        }

        if (media) {
            const mediaStartIndex = this.rules.findIndex(eachRule => eachRule.media)
            if (mediaStartIndex !== -1) {
                const maxWidthFeature = media.features[MAX_WIDTH]
                const minWidthFeature = media.features[MIN_WIDTH]
                if (maxWidthFeature && minWidthFeature) {
                    /**
                     * 範圍越小 ( 越限定 越侷限 ) 越優先，
                     * 按照範圍 max-width - min-width 遞減排序
                     * find 第一個所遇到同樣 feature 且範圍值比自己大的 rule，
                     * 並插入在該 rule 之後，讓自己優先被套用
                     */
                    const range = maxWidthFeature.value - minWidthFeature.value
                    for (let i = endIndex; i >= mediaStartIndex; i--) {
                        index = i

                        const eachRule = this.rules[i]
                        const eachMedia = eachRule.media
                        const eachMaxWidthFeature = eachMedia.features[MAX_WIDTH]
                        const eachMinWidthFeature = eachMedia.features[MIN_WIDTH]
                        if (!eachMaxWidthFeature || !eachMinWidthFeature) {
                            index++
                            break
                        }

                        const eachRange = eachMaxWidthFeature.value - eachMinWidthFeature.value
                        if (eachRange === range) {
                            if (hasWhere !== eachRule.hasWhere)
                                continue

                            if (prioritySelectorIndex !== -1) {
                                const sameRangeRules = [this.rules[i]]
                                for (let j = i - 1; j >= mediaStartIndex; j--) {
                                    const currentMediaRule = this.rules[j]
                                    if (currentMediaRule.hasWhere !== hasWhere)
                                        break

                                    const currentMedia = currentMediaRule.media
                                    const currentMaxWidthFeature = currentMedia.features[MAX_WIDTH]
                                    const currentMinWidthFeature = currentMedia.features[MIN_WIDTH]
                                    if (
                                        !currentMaxWidthFeature
                                        || !currentMinWidthFeature
                                        || (currentMaxWidthFeature.value - currentMinWidthFeature.value !== eachRange)
                                    )
                                        break

                                    sameRangeRules.unshift(this.rules[j])
                                }

                                index = findPrioritySelectorInsertIndex(
                                    this.rules,
                                    eachRule => eachRule.media && eachRule.prioritySelectorIndex !== -1 && eachRule.media.features[MIN_WIDTH] && eachRule.media.features[MAX_WIDTH])
                            }

                            break
                        } else if (eachRange > range) {
                            break
                        }
                    }
                } else if (minWidthFeature) {
                    /**
                     * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                     * 並插入在該 rule 之後，讓自己優先被套用
                     */
                    for (let i = mediaStartIndex; i <= endIndex; i++) {
                        index = i

                        const eachRule = this.rules[i]
                        const eachMedia = eachRule.media
                        const eachMaxWidthFeature = eachMedia.features[MAX_WIDTH]
                        const eachMinWidthFeature = eachMedia.features[MIN_WIDTH]
                        if (eachMaxWidthFeature) {
                            /**
                             * 永遠插入在 range feature 前
                             */
                            if (eachMinWidthFeature) {
                                break
                            } else {
                                continue
                            }
                        }

                        const value = eachMinWidthFeature?.value
                        if (value === minWidthFeature.value) {
                            if (!hasWhere && eachRule.hasWhere) {
                                index++
                                continue
                            }

                            if (prioritySelectorIndex !== -1) {
                                index = findPrioritySelectorInsertIndex(
                                    this.rules,
                                    eachRule => eachRule.media,
                                    eachRule => eachRule.media && eachRule.prioritySelectorIndex !== -1 && eachRule.media.features[MIN_WIDTH] && eachRule.media.features[MAX_WIDTH],
                                    eachRule => !eachRule.media.features[MIN_WIDTH] && !eachRule.media.features[MAX_WIDTH])
                            } else {
                                for (let j = i; j <= endIndex; j++) {
                                    const currentMediaRule = this.rules[j]
                                    const currentMedia = currentMediaRule.media
                                    const currentMinWidthFeature = currentMedia.features[MIN_WIDTH]
                                    const currentMaxWidthFeature = currentMedia.features[MAX_WIDTH]

                                    if (currentMaxWidthFeature)
                                        continue

                                    if (
                                        currentMediaRule.hasWhere !== hasWhere
                                        || currentMinWidthFeature.value !== value
                                        || currentMediaRule.order >= order
                                    )
                                        break

                                    index = j + 1
                                }
                            }

                            break
                        } else if (value > minWidthFeature.value) {
                            break
                        } else {
                            index++
                        }
                    }
                } else if (maxWidthFeature) {
                    /**
                     * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                     * 並插入在該 rule 之後，讓自己優先被套用
                     */
                    for (let i = endIndex; i >= mediaStartIndex; i--) {
                        index = i

                        const eachRule = this.rules[i]
                        const eachMedia = eachRule.media
                        const eachMaxWidthFeature = eachMedia.features[MAX_WIDTH]
                        const eachMinWidthFeature = eachMedia.features[MIN_WIDTH]
                        if (eachMinWidthFeature) {
                            /**
                             * 永遠插入在 range feature 前
                             */
                            continue
                        }

                        const value = eachMaxWidthFeature?.value
                        if (!value || value > maxWidthFeature.value) {
                            index++
                            break
                        } else if (value === maxWidthFeature.value) {
                            if (hasWhere && !eachRule.hasWhere)
                                continue

                            if (prioritySelectorIndex !== -1) {
                                index = findPrioritySelectorInsertIndex(
                                    this.rules,
                                    eachRule => eachRule.media,
                                    eachRule => eachRule.media && eachRule.prioritySelectorIndex !== -1 && eachRule.media.features[MIN_WIDTH] && eachRule.media.features[MAX_WIDTH],
                                    eachRule => !eachRule.media.features[MIN_WIDTH] && !eachRule.media.features[MAX_WIDTH])
                            } else {
                                const sameRangeRules = [this.rules[i]]
                                for (let j = i - 1; j >= mediaStartIndex; j--) {
                                    const currentMediaRule = this.rules[j]
                                    const currentMedia = currentMediaRule.media
                                    const currentMinWidthFeature = currentMedia.features[MIN_WIDTH]
                                    const currentMaxWidthFeature = currentMedia.features[MAX_WIDTH]

                                    if (
                                        !currentMinWidthFeature
                                        && (!currentMaxWidthFeature
                                            || currentMaxWidthFeature.value !== value
                                            || currentMediaRule.hasWhere !== hasWhere)
                                    )
                                        break

                                    sameRangeRules.unshift(currentMediaRule)
                                }

                                for (let j = 0; j < sameRangeRules.length; j++) {
                                    const currentMediaRule = sameRangeRules[j]

                                    if (currentMediaRule.media.features[MIN_WIDTH])
                                        continue

                                    if (currentMediaRule.order >= order)
                                        break

                                    index = i - sameRangeRules.length + 2 + j
                                }
                            }

                            break
                        }
                    }
                }
            }
            /**
             * 如果找不到目標位置則插在最後面
             */
            if (index === undefined) {
                if (mediaStartIndex === -1) {
                    // 無任何 media 時，優先級最高
                    index = endIndex + 1
                } else if (prioritySelectorIndex !== -1) {
                    // 含有優先 selector
                    index = mediaStartIndex +
                        findPrioritySelectorInsertIndex(
                            this.rules.slice(mediaStartIndex),
                            undefined,
                            eachRule => eachRule.media.features[MAX_WIDTH] || eachRule.media.features[MIN_WIDTH])
                } else if (hasWhere) {
                    // 不含優先 selector，且含有 where，優先級最低
                    let i = mediaStartIndex
                    for (; i < this.rules.length; i++) {
                        const eachRule = this.rules[i]
                        if (eachRule.prioritySelectorIndex !== -1 || !eachRule.hasWhere || eachRule.order >= order) {
                            index = i
                            break
                        }
                    }

                    if (index === undefined) {
                        index = i
                    }
                } else {
                    // 不含優先 selector，且不含有 where，優先級緊接非 min-width / max-width 的 where 之後
                    for (let i = mediaStartIndex; i <= endIndex; i++) {
                        index = i

                        const eachRule = this.rules[i]
                        const eachMedia = eachRule.media
                        if (eachRule.prioritySelectorIndex !== -1 || eachMedia.features[MAX_WIDTH] || eachMedia.features[MIN_WIDTH])
                            break

                        if (eachRule.hasWhere) {
                            index++
                        } else if (eachRule.order >= order) {
                            break
                        }
                    }
                }
            }
        } else {
            if (prioritySelectorIndex === -1) {
                // 不含優先 selector
                if (hasWhere) {
                    // 含有 where，優先級最低
                    index = this.rules.findIndex(eachRule => !eachRule.hasWhere
                        || eachRule.media
                        || eachRule.prioritySelectorIndex !== -1
                        || eachRule.order >= order)

                    if (index === -1) {
                        index = endIndex + 1
                    }
                } else {
                    // 不含 where，優先級緊接 where 之後
                    let i = 0
                    for (; i < this.rules.length; i++) {
                        const eachRule = this.rules[i]
                        if (eachRule.media || !eachRule.hasWhere && (eachRule.order >= order || eachRule.prioritySelectorIndex !== -1)) {
                            index = i
                            break
                        }
                    }

                    if (index === undefined) {
                        index = i
                    }
                }
            } else {
                // 含有優先 selector
                index = findPrioritySelectorInsertIndex(this.rules, undefined, eachRule => eachRule.media)
            }
        }

        this.rules.splice(index, 0, rule)
        this.ruleOfClass[className] = rule

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
    }

    delete(className: string) {
        /**
         * class name 從 DOM tree 中被移除，
         * 匹配並刪除對應的 rule
         */
        const sheet = this.style.sheet
        const deleteRule = (name: string) => {
            const rule = this.ruleOfClass[name]
            if (
                !rule
                || name in this.relations && this.relations[name].some(eachClassName => eachClassName in this.countOfClass)
            )
                return

            if (rule.natives.length) {
                const firstNative = rule.natives[0]
                for (let index = 0; index < sheet.cssRules.length; index++) {
                    const eachCssRule = sheet.cssRules[index]
                    if (eachCssRule === firstNative.cssRule) {
                        for (let i = 0; i < rule.natives.length; i++) {
                            sheet.deleteRule(index)
                        }

                        this.rules.splice(this.rules.indexOf(rule), 1)
                        break
                    }
                }
            }

            delete this.ruleOfClass[name]
        }

        if (className in this.classes) {
            for (const eachClassName of this.classes[className]) {
                if (!(eachClassName in this.countOfClass)) {
                    deleteRule(eachClassName)
                }
            }

            delete this.ruleOfClass[className]
        } else {
            deleteRule(className)
        }
    }

    findAndInsert(className: string) {
        const rule = this.findAndNew(className)
        if (Array.isArray(rule)) {
            for (const eachRule of rule) {
                this.insert(eachRule)
            }
        } else if (rule) {
            this.insert(rule)
        }
    }

    get text() {
        return this.rules.map((eachRule) =>
            eachRule.natives
                .map((eachNativeRule) => eachNativeRule.text)
                .join('')
        ).join('')
    }
}

if (isBrowser) {
    window.MasterCSS = MasterCSS
}

declare global {
    interface Window {
        MasterCSS: typeof MasterCSS;
    }
}