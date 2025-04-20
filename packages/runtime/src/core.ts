import { MasterCSS, config as defaultConfig, VariableRule, AnimationRule } from '@master/css'
import { type Config } from '@master/css'
import registerGlobal from './register-global'
import { HydrateResult } from './types'
import RuntimeLayer from './layer'
import RuntimeSyntaxLayer, { RuntimeSyntaxLayerInstance } from './syntax-layer'

export default class CSSRuntime extends MasterCSS {
    static instances = new WeakMap<Document | ShadowRoot, CSSRuntime>()
    readonly host: Element
    readonly observing = false
    readonly progressive = false
    readonly container: HTMLElement | ShadowRoot
    readonly observer?: MutationObserver
    readonly baseLayer = new RuntimeSyntaxLayer('base', this)
    readonly themeLayer = new RuntimeLayer('theme', this)
    readonly presetLayer = new RuntimeSyntaxLayer('preset', this)
    readonly componentsLayer = new RuntimeSyntaxLayer('components', this)
    readonly generalLayer = new RuntimeSyntaxLayer('general', this)
    readonly classCounts = new Map<string, number>()

    constructor(
        public root: Document | ShadowRoot = document,
        public customConfig: Config = defaultConfig
    ) {
        super(customConfig)
        if (this.root instanceof Document || this.root instanceof HTMLDocument) {
            this.root.defaultView!.globalThis.cssRuntime = this
            this.container = this.root.head
            this.host = this.root.documentElement
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
    observe() {
        if (this.observing) return this
        // 1. Check if the stylesheet is progressive.
        if (this.root.styleSheets)
            for (const sheet of this.root.styleSheets) {
                const { ownerNode } = sheet
                if (ownerNode && (ownerNode as HTMLStyleElement).id === 'master') {
                    this.style = ownerNode as HTMLStyleElement
                    if (this.style.sheet?.cssRules.length) {
                        // @ts-ignore
                        this.progressive = true
                    }
                    break
                }
            }
        // 2. Count the classes in the host and its children.
        const connectedNames = new Set<string>()
        const increaseClassCount = (className: string) => {
            const count = this.classCounts.get(className) || 0
            if (!count) {
                connectedNames.add(className)
            }
            this.classCounts.set(className, count + 1)
        }

        if (this.root instanceof Document || this.root instanceof HTMLDocument) {
            this.root.querySelectorAll('[class]').forEach((element) => element.classList.forEach(increaseClassCount))
        } else {
            this.container.querySelectorAll('[class]').forEach((element) => element.classList.forEach(increaseClassCount))
            this.host.classList.forEach(increaseClassCount)
        }

        // 3. Hydrate the existing CSS rules or create a new one.
        if (this.progressive) {
            const hydrateResult = this.hydrate(this.style!.sheet!.cssRules)
            // Add the connected class names that are not hydrated yet.
            for (const eachConnectedName of connectedNames) {
                if (hydrateResult.allSyntaxRules.find((rule) => (rule.fixedClass || rule.name) === eachConnectedName)) continue
                this.add(eachConnectedName)
                if (process.env.NODE_ENV === 'development') {
                    // Basically, the style#master should have all the prerendered CSS rules that are connected in the DOM.
                    console.debug(`The class \`${eachConnectedName}\` was added via script before calling hydrate, or the corresponding CSS rule were not properly pre-rendered.`)
                }
            }
        } else {
            this.style = document.createElement('style')
            this.style.id = 'master'
            this.container.append(this.style)
            this.style.sheet!.insertRule(this.layerStatementRule.text)
            this.layerStatementRule.native = this.style!.sheet!.cssRules.item(0) as CSSLayerStatementRule
            for (const eachConnectedName of connectedNames) {
                this.add(eachConnectedName)
            }
        }

        // @ts-expect-error readonly
        this.observer = new MutationObserver((mutationRecords) => {
            const eachClassCounts = new Map()
            const targetFirstAttrMutationRecord = new Map<Element, MutationRecord>()
            const updateClassCount = (classes: Set<string> | string[] | DOMTokenList, isAdding = false) => {
                const usage = isAdding ? 1 : -1
                classes.forEach((className) => {
                    eachClassCounts.set(className, (eachClassCounts.get(className) || 0) + usage)
                })
            }
            const connectedStatusMap = new Map<Element, { change: number, mutationRecord: MutationRecord }>()
            const disconnectedStatusMap = new Map<Element, { change: number, mutationRecord: MutationRecord }>()
            const recordStatus = (target: Element, mutationRecord: MutationRecord, map: Map<Element, { change: number, mutationRecord: MutationRecord }>, adding: boolean) => {
                const status = map.get(target)
                if (status) {
                    status.change += adding ? 1 : -1
                    status.mutationRecord = mutationRecord
                } else {
                    map.set(target, { change: adding ? 1 : -1, mutationRecord })
                }
                for (const child of target.children) {
                    if ('classList' in child) {
                        recordStatus(child as Element, mutationRecord, map, adding)
                    }
                }
            }
            mutationRecords.forEach((mutationRecord) => {
                const target = mutationRecord.target as Element
                switch (mutationRecord.type) {
                    case 'attributes':
                        if (!targetFirstAttrMutationRecord.has(target)) {
                            targetFirstAttrMutationRecord.set(target, mutationRecord)
                        }
                        break
                    case 'childList':
                        const targetStatusMap = target.isConnected ? connectedStatusMap : disconnectedStatusMap
                        mutationRecord.addedNodes.forEach((node) =>
                            'classList' in node && recordStatus(node as Element, mutationRecord, targetStatusMap, true)
                        )
                        mutationRecord.removedNodes.forEach((node) =>
                            'classList' in node && recordStatus(node as Element, mutationRecord, targetStatusMap, false)
                        )
                        break
                }
            })
            const updateTarget = (target: Element, adding: boolean) => {
                const firstAttrMutationRecord = targetFirstAttrMutationRecord.get(target)
                if (firstAttrMutationRecord) {
                    targetFirstAttrMutationRecord.delete(target)
                }
                if (adding) {
                    updateClassCount(target.classList, adding)
                } else {
                    if (firstAttrMutationRecord) {
                        updateClassCount(firstAttrMutationRecord.oldValue ? firstAttrMutationRecord.oldValue.split(/\s+/) : [], adding)
                    } else {
                        updateClassCount(target.classList, adding)
                    }
                    disconnectedStatusMap.forEach((disconnectedTargetStatus, disconnectedTarget) => {
                        if (disconnectedTargetStatus.mutationRecord.target === target && disconnectedTargetStatus.change !== 0) {
                            updateTarget(disconnectedTarget, disconnectedTargetStatus.change > 0)
                        }
                    })
                }
            }
            connectedStatusMap.forEach(({ change }, target) => change !== 0 && updateTarget(target, change > 0))
            targetFirstAttrMutationRecord.forEach((mutation, target) => {
                if (!target.isConnected) return
                const oldClassList = mutation.oldValue ? mutation.oldValue.split(/\s+/) : []
                const newClassList = target.classList
                const addedClasses: string[] = []
                newClassList.forEach(c => {
                    if (!oldClassList.includes(c)) addedClasses.push(c)
                })
                const removedClasses = oldClassList.filter(c => !newClassList.contains(c))
                if (addedClasses.length) {
                    updateClassCount(addedClasses, true)
                }
                if (removedClasses.length) {
                    updateClassCount(removedClasses, false)
                }
            })

            /**
             * Merge the class usage changes into the current class usage map.
             */
            eachClassCounts.forEach((countChange, className) => {
                let currentCount = this.classCounts.get(className) || 0
                let newCount = currentCount + countChange
                if (newCount > 0) {
                    this.classCounts.set(className, newCount)
                    if (currentCount === 0) {
                        this.add(className)
                    }
                } else {
                    this.classCounts.delete(className)
                    this.remove(className)
                }
            })

            globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:mutated', {
                records: mutationRecords,
                classCounts: eachClassCounts,
                cssRuntime: this
            })
        })

        this.observer.observe(this.root, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['class'],
            subtree: true,
            childList: true,
        })

        if (!this.progressive) {
            this.host.removeAttribute('hidden')
        }

        // @ts-ignore
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
            // @ts-expect-error readonly
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