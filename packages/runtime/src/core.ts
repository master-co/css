import { MasterCSS, config as defaultConfig, VariableRule, AnimationRule } from '@master/css'
import { type Config } from '@master/css'
import registerGlobal from './register-global'
import { HydrateResult } from './types'
import RuntimeLayer from './layer'
import RuntimeSyntaxLayer, { RuntimeSyntaxLayerInstance } from './syntax-layer'

export default class CSSRuntime extends MasterCSS {
    static instances = new WeakMap<Document | ShadowRoot, CSSRuntime>()
    readonly host: Element
    readonly container: HTMLElement | ShadowRoot
    readonly baseLayer = new RuntimeSyntaxLayer('base', this)
    readonly themeLayer = new RuntimeLayer('theme', this)
    readonly presetLayer = new RuntimeSyntaxLayer('preset', this)
    readonly componentsLayer = new RuntimeSyntaxLayer('components', this)
    readonly generalLayer = new RuntimeSyntaxLayer('general', this)
    readonly classCounts = new Map<string, number>()
    observer?: MutationObserver
    progressive = false
    observing = false

    constructor(
        public root: Document | ShadowRoot = document,
        public customConfig: Config = defaultConfig,
        public baseConfig?: Config
    ) {
        super(customConfig, baseConfig)
        // Do not use instanceof here, because it will not work
        const rootConstructorName = root?.constructor.name
        if (rootConstructorName === 'HTMLDocument' || rootConstructorName === 'Document') {
            (this.root as Document).defaultView!.globalThis.cssRuntime = this
            this.container = (this.root as Document).head
            this.host = (this.root as Document).documentElement
        } else {
            this.container = this.root as CSSRuntime['container']
            this.host = (this.root as ShadowRoot).host
        }
        globalThis.CSSRuntime.instances.set(this.root, this)
        __MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:created', { cssRuntime: this })
    }

    /**
     * Observe the DOM for changes and update the running stylesheet. (browser only)
     * @param options mutation observer options
     * @returns this
     */
    observe(): this {
        if (this.observing) return this

        // Detect prerendered stylesheet
        if (this.root.styleSheets) {
            for (const sheet of this.root.styleSheets) {
                const { ownerNode } = sheet
                if (ownerNode instanceof HTMLStyleElement && ownerNode.id === 'master') {
                    this.style = ownerNode
                    if (this.style.sheet?.cssRules.length) {
                        this.progressive = true
                    }
                    break
                }
            }
        }

        // Prepare snapshot map
        const elementClasses = new WeakMap<Element, Set<string>>()

        // Initial scan and populate counts + snapshot
        const connectedNames = new Set<string>()
        const increaseClassCount = (className: string) => {
            const count = this.classCounts.get(className) || 0
            if (!count) connectedNames.add(className)
            this.classCounts.set(className, count + 1)
        }
        const elementsWithClass = this.root.querySelectorAll('[class]')
        elementsWithClass.forEach(el => {
            const clsList = el.classList
            if (clsList) {
                el.classList.forEach(increaseClassCount)
            }
            elementClasses.set(el, new Set(clsList))
        })

        // Hydration or style creation
        if (this.progressive) {
            const hydrateResult = this.hydrate(this.style!.sheet!.cssRules)
            for (const cls of connectedNames) {
                if (!hydrateResult.allSyntaxRules.find(r => (r.fixedClass || r.name) === cls)) {
                    this.add(cls)
                    if (process.env.NODE_ENV === 'development') {
                        console.debug(`Missing prerendered rule for class \`${cls}\``)
                    }
                }
            }
        } else {
            this.style = document.createElement('style')
            this.style.id = 'master'
            this.style.setAttribute('blocking', 'render')
            this.container.append(this.style)
            this.style.sheet!.insertRule(this.layerStatementRule.text)
            this.layerStatementRule.native = this.style.sheet!.cssRules.item(0) as CSSLayerStatementRule
            connectedNames.forEach(cls => this.add(cls))
        }

        this.observer = new MutationObserver(records => {
            const deltaCounts = new Map<string, number>()
            const nodeMap = new Map<Element, number>()
            const attrRecords = new Set<Element>()
            const visited = new WeakSet<Element>()

            const updateDelta = (cls: string, delta: number) =>
                deltaCounts.set(cls, (deltaCounts.get(cls) || 0) + delta)

            const diffAndSnapshot = (el: Element) => {
                const prev = new Set(elementClasses.get(el) || [])
                const next = new Set(el.classList)
                for (const c of next) if (!prev.has(c)) updateDelta(c, 1)
                for (const c of prev) if (!next.has(c)) updateDelta(c, -1)
                elementClasses.set(el, next)
            }

            const removeSnapshot = (el: Element) => {
                for (const c of elementClasses.get(el) || []) updateDelta(c, -1)
                elementClasses.delete(el)
            }

            for (const record of records) {
                if (record.type === 'childList') {
                    for (const node of record.addedNodes)
                        if (node instanceof Element && node.isConnected)
                            nodeMap.set(node, (nodeMap.get(node) || 0) + 1)

                    for (const node of record.removedNodes)
                        if (node instanceof Element && !node.isConnected)
                            nodeMap.set(node, (nodeMap.get(node) || 0) - 1)
                } else if (record.type === 'attributes' && record.attributeName === 'class') {
                    attrRecords.add(record.target as Element)
                }
            }

            const traverseIncludingSelf = (el: Element, fn: (el: Element) => void, visited: WeakSet<Element>) => {
                if (!visited.has(el)) {
                    visited.add(el)
                    fn(el)
                    for (const child of el.children) {
                        traverseIncludingSelf(child, fn, visited)
                    }
                } else {
                    nodeMap.delete(el)
                }
            }

            for (const [node, count] of nodeMap) {
                if (count > 0) {
                    traverseIncludingSelf(node, diffAndSnapshot, visited)
                } else if (count < 0 && !node.isConnected) {
                    traverseIncludingSelf(node, removeSnapshot, visited)
                }
            }

            for (const el of attrRecords) {
                if (!visited.has(el)) diffAndSnapshot(el)
            }

            for (const [cls, change] of deltaCounts) {
                const current = this.classCounts.get(cls) || 0
                const next = current + change
                if (next > 0) {
                    this.classCounts.set(cls, next)
                    if (current === 0) this.add(cls)
                } else {
                    this.classCounts.delete(cls)
                    this.remove(cls)
                }
            }

            globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:mutated', {
                records,
                classCounts: deltaCounts,
                cssRuntime: this
            })
        })

        this.observer.observe(this.root, {
            childList: true,
            attributes: true,
            attributeFilter: ['class'],
            attributeOldValue: true,
            subtree: true,
        })

        if (!this.progressive) this.host.removeAttribute('hidden')
        this.observing = true
        globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:observed', { cssRuntime: this })
        return this
    }

    hydrate(nativeLayerRules: CSSRuleList) {
        const cssLayerRules: CSSLayerBlockRule[] = []
        const checkSheet = new CSSStyleSheet()
        const result: HydrateResult = {
            allSyntaxRules: []
        }
        for (let i = 0; i < nativeLayerRules.length; i++) {
            const eachNativeCSSRule = nativeLayerRules[i]
            if (eachNativeCSSRule.constructor.name === 'CSSLayerBlockRule') {
                const eachCSSLayerRule = eachNativeCSSRule as CSSLayerBlockRule
                if ((eachNativeCSSRule as CSSLayerBlockRule).name === 'theme') {
                    this.themeLayer.native = eachCSSLayerRule
                    let variableRule: VariableRule | undefined
                    const unresolvedCSSRules = new Map<string, CSSRule>()
                    for (const rule of eachCSSLayerRule.cssRules) {
                        // trim() for fix the firefox bug that the cssText ends with \n\n
                        unresolvedCSSRules.set(rule.cssText.trim(), rule)
                    }
                    for (const cssRule of eachCSSLayerRule.cssRules) {
                        if (!unresolvedCSSRules.has(cssRule.cssText)) continue
                        const variableCSSRule = (cssRule.constructor.name === 'CSSMediaRule'
                            ? (cssRule as CSSMediaRule).cssRules[0]
                            : cssRule) as CSSStyleRule
                        const variableName = variableCSSRule.style[0].slice(2)
                        const variable = this.variables.get(variableName)
                        if (!variable) continue
                        variableRule = new VariableRule(variableName, variable, this)
                        this.themeLayer.rules.push(variableRule)
                        this.themeLayer.tokenCounts.set(variableRule.name, 0)
                        variableRule.nodes.forEach((node) => {
                            const checkRuleIndex = checkSheet.insertRule(node.text)
                            const checkNodeNativeRule = checkSheet.cssRules.item(checkRuleIndex)
                            if (checkNodeNativeRule) {
                                const checkNodeNativeRuleText = checkNodeNativeRule.cssText.trim()
                                const match = unresolvedCSSRules.get(checkNodeNativeRuleText)
                                if (match) {
                                    node.native = match
                                    unresolvedCSSRules.delete(checkNodeNativeRuleText)
                                    return
                                }
                            }
                        })
                    }
                    if (this.themeLayer.rules.length) this.rules.push(this.themeLayer)
                } else {
                    cssLayerRules.push(eachCSSLayerRule)
                }
            } else if (eachNativeCSSRule.constructor.name === 'CSSLayerStatementRule') {
                this.layerStatementRule.native = eachNativeCSSRule as CSSLayerStatementRule
            } else if (eachNativeCSSRule.constructor.name === 'CSSKeyframesRule') {
                const nativeKeyframsRule = eachNativeCSSRule as CSSKeyframesRule
                const keyframes = this.animations.get(nativeKeyframsRule.name)
                if (!keyframes) continue
                const animationRule = new AnimationRule(nativeKeyframsRule.name, keyframes, this)
                animationRule.native = nativeKeyframsRule as unknown as CSSKeyframeRule
                this.animationsNonLayer.rules.push(animationRule)
                this.rules.push(animationRule)
                this.animationsNonLayer.tokenCounts.set(animationRule.name, 0)
            }
        }
        for (const eachCSSLayerRule of cssLayerRules) {
            let layer: RuntimeSyntaxLayerInstance
            switch (eachCSSLayerRule.name) {
                case 'base':
                    layer = this.baseLayer
                    break
                case 'preset':
                    layer = this.presetLayer
                    break
                case 'components':
                    layer = this.componentsLayer
                    break
                case 'general':
                    layer = this.generalLayer
                    break
                default:
                    console.error(`Cannot recognize the layer \`${eachCSSLayerRule.name}\`. (https://rc.css.master.co/messages/hydration-errors)`)
                    continue
            }
            layer.native = eachCSSLayerRule
            const unresolvedCSSRules = new Map<string, CSSRule>()
            for (const rule of eachCSSLayerRule.cssRules) {
                // trim() for fix the firefox bug that the cssText ends with \n\n
                unresolvedCSSRules.set(rule.cssText.trim(), rule)
            }

            for (const eachNativeLayerRule of eachCSSLayerRule.cssRules) {
                if (!unresolvedCSSRules.has(eachNativeLayerRule.cssText)) continue
                const selectorText = this.getSelectorText(eachNativeLayerRule)
                if (!selectorText) {
                    console.error(`Cannot get the selector text from \`${eachNativeLayerRule.cssText}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                    continue
                }
                const createdRules = this.createFromSelectorText(selectorText)
                if (createdRules) {
                    for (const createdRule of createdRules) {
                        layer.rules.push(createdRule)
                        layer.insertVariables(createdRule)
                        layer.insertAnimations(createdRule)
                        result.allSyntaxRules.push(createdRule)
                        try {
                            const checkRuleIndex = checkSheet.insertRule(createdRule.text)
                            const checkNodeNativeRule = checkSheet.cssRules.item(checkRuleIndex)
                            if (checkNodeNativeRule) {
                                const checkNodeNativeRuleText = checkNodeNativeRule.cssText.trim()
                                const match = unresolvedCSSRules.get(checkNodeNativeRuleText)
                                if (match) {
                                    createdRule.native = match
                                    unresolvedCSSRules.delete(checkNodeNativeRuleText)
                                    continue
                                }
                            }
                            console.error(`Cannot retrieve CSS rule for \`${createdRule.text}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                        } catch (error) {
                            if (process.env.NODE_ENV === 'development') {
                                console.debug(`Cannot insert CSS rule for \`${createdRule.text}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                            }
                        }
                    }
                } else {
                    console.error(`Cannot recognize \`${eachNativeLayerRule.cssText}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                }
            }
            if (layer.rules.length) this.rules.push(layer)
        }
        globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:hydrated', { cssRuntime: this, result })
        return result
    }

    getSelectorText(cssRule: CSSRule): string | undefined {
        if (cssRule instanceof CSSStyleRule) {
            return cssRule.selectorText as string
        } else if (cssRule instanceof CSSGroupingRule) {
            return this.getSelectorText((cssRule.cssRules).item(0)!)
        }
    }

    disconnect() {
        if (!this.observing) return
        if (this.observer) {
            this.observer.disconnect()
            this.observer = undefined
        }
        // @ts-ignore
        this.observing = false
        this.reset()
        this.classCounts.clear()
        if (!this.progressive) {
            this.style?.remove()
            this.style = null
        }
        globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:disconnected', { cssRuntime: this })
        return this
    }

    refresh(customConfig = this.customConfig) {
        if (!this.observing || !this.style!.sheet) return this
        for (let i = 1; i <= this.style!.sheet.cssRules.length - 1; i++) {
            this.style!.sheet.deleteRule(i)
        }
        super.refresh(customConfig)
        /**
         * 拿當前所有的 classNames 按照最新的 colors, config.rules 匹配並生成新的 style
         * 所以 refresh 過後 rules 可能會變多也可能會變少
         */
        this.classCounts.forEach((_, className) => {
            this.add(className)
        })
        globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:refreshed', { cssRuntime: this, customConfig })
        return this
    }

    destroy() {
        this.disconnect()
        globalThis.CSSRuntime.instances.delete(this.root)
        globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:destroyed', { cssRuntime: this })
        return this
    }
}

(function (CSSRuntime) {
    registerGlobal(CSSRuntime)
})(CSSRuntime)