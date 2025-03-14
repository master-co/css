import { MasterCSS, config as defaultConfig, Rule, SyntaxLayer, RuleNode } from '@master/css'
import { type Config, SyntaxRule } from '@master/css'

import './types/global'

export class RuntimeCSS extends MasterCSS {
    // @ts-expect-error
    readonly host: Element
    readonly observing = false
    readonly progressive = false
    // @ts-expect-error
    readonly container: HTMLElement | ShadowRoot
    readonly observer?: MutationObserver

    constructor(
        public root: Document | ShadowRoot = document,
        public customConfig: Config = defaultConfig
    ) {
        super(customConfig)
        this.init()
        this.supportVendors = new Set()
        const styleDeclaration = document.documentElement.style
        if ('webkitTransform' in styleDeclaration) this.supportVendors.add('webkit')
        if ('MozTransform' in styleDeclaration) this.supportVendors.add('moz')
        if ('msTransform' in styleDeclaration) this.supportVendors.add('ms')
        if ('OTransform' in styleDeclaration) this.supportVendors.add('o')
    }

    init() {
        const existingRuntimeCSS = (globalThis as any).runtimeCSSs.find((eachCSS: RuntimeCSS) => eachCSS.root === this.root)
        if (existingRuntimeCSS) throw new Error('Cannot create multiple RuntimeCSS instances for the same root element.')
        const rootConstructorName = this.root?.constructor.name
        if (rootConstructorName === 'HTMLDocument' || rootConstructorName === 'Document') {
            // @ts-ignore
            (this.root as Document).defaultView.globalThis.runtimeCSS = this
            // @ts-ignore readonly
            this.container = (this.root as Document).head
            // @ts-ignore readonly
            this.host = (this.root as Document).documentElement
        } else {
            // @ts-ignore readonly
            this.container = this.root as RuntimeCSS['container']
            // @ts-ignore readonly
            this.host = (this.root as ShadowRoot).host
        }
        runtimeCSSs.push(this)
    }

    /**
     * Observe the DOM for changes and update the running stylesheet. (browser only)
     * @param options mutation observer options
     * @returns this
     */
    observe() {
        if (this.observing) return this
        if (this.root.styleSheets)
            for (const sheet of this.root.styleSheets) {
                const { ownerNode } = sheet
                if (ownerNode && (ownerNode as HTMLStyleElement).id === 'master') {
                    this.style = ownerNode as HTMLStyleElement
                    // @ts-ignore
                    this.progressive = true
                    break
                }
            }
        if (this.progressive) {
            this.hydrate(this.style!.sheet!.cssRules)
        } else {
            this.style = document.createElement('style')
            this.style.id = 'master'
            this.container.append(this.style)
            this.style.sheet!.insertRule(this.layerStatementRule.text)
            this.layerStatementRule.nodes[0].native = this.style!.sheet!.cssRules.item(0) as CSSLayerStatementRule
        }

        const firstConnectedElementsClasses = new Map<Element, string[]>()
        const addClasses = (element: Element) => {
            element.classList.forEach((className) => {
                if (this.classUsages.has(className)) {
                    this.classUsages.set(className, this.classUsages.get(className)! + 1)
                } else {
                    this.classUsages.set(className, 1)
                    this.add(className)
                }
                const classes = firstConnectedElementsClasses.get(element)
                if (classes) {
                    classes.push(className)
                } else {
                    firstConnectedElementsClasses.set(element, [className])
                }
            })
        }

        addClasses(this.host);

        /**
         * 待所有 DOM 結構完成解析後，開始繪製 Rule 樣式
         */
        ((this.root.constructor.name === 'HTMLDocument') ? this.host : this.container)
            .querySelectorAll('[class]')
            .forEach((element) => {
                addClasses(element)
            })

        // @ts-expect-error readonly
        this.observer = new MutationObserver((mutationRecords) => {
            // console.clear()
            // const test = ''
            // if (test) {
            //     console.log('')
            //     console.log(`${test}: ${this.classUsages.get(test)}`)
            // }
            const eachClassUsages = new Map()
            const targetFirstAttrMutationRecord = new Map<Element, MutationRecord>()

            const updateClassUsage = (classes: Set<string> | string[] | DOMTokenList, isAdding = false) => {
                const usage = isAdding ? 1 : -1
                classes.forEach((className) => {
                    eachClassUsages.set(className, (eachClassUsages.get(className) || 0) + usage)
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

            const updatedTargetChangeMap = new Map<Element, number>()

            const updateTarget = (target: Element, adding: boolean) => {
                const change = updatedTargetChangeMap.get(target) || 0
                const newChange = change + (adding ? 1 : -1)
                if (newChange >= -1 && newChange <= 1) {
                    updatedTargetChangeMap.set(target, newChange)
                    const firstAttrMutationRecord = targetFirstAttrMutationRecord.get(target)
                    if (firstAttrMutationRecord) {
                        targetFirstAttrMutationRecord.delete(target)
                    }
                    if (adding) {
                        updateClassUsage(target.classList, adding)
                    } else {
                        if (firstAttrMutationRecord) {
                            updateClassUsage(firstAttrMutationRecord.oldValue ? firstAttrMutationRecord.oldValue.split(/\s+/) : [], adding)
                        } else {
                            updateClassUsage(target.classList, adding)
                        }
                        disconnectedStatusMap.forEach((disconnectedTargetStatus, disconnectedTarget) => {
                            if (disconnectedTargetStatus.mutationRecord.target === target && disconnectedTargetStatus.change !== 0) {
                                updateTarget(disconnectedTarget, disconnectedTargetStatus.change > 0)
                            }
                        })
                    }
                    for (const child of target.children) {
                        updateTarget(child as Element, adding)
                    }
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
                    // console.log('[attribute]', '[add]   ', addedClasses, target)
                    updateClassUsage(addedClasses, true)
                }
                if (removedClasses.length) {
                    // console.log('[attribute]', '[remove]', removedClasses, target)
                    updateClassUsage(removedClasses, false)
                }
            })

            /**
             * Merge the class usage changes into the current class usage map.
             */
            eachClassUsages.forEach((countChange, className) => {
                let currentCount = this.classUsages.get(className) || 0
                let newCount = currentCount + countChange
                if (newCount > 0) {
                    this.classUsages.set(className, newCount)
                    if (currentCount === 0) {
                        this.add(className)
                    }
                } else {
                    this.classUsages.delete(className)
                    this.remove(className)
                }
            })

            // start: debug
            // const safeClassUsages: any = {};
            // ((this.root.constructor.name === 'HTMLDocument') ? this.host : this.container)
            //     .querySelectorAll('[class]')
            //     .forEach((element) => {
            //         element.classList.forEach((className) => {
            //             if (Object.prototype.hasOwnProperty.call(safeClassUsages, className)) {
            //                 safeClassUsages[className]++
            //             } else {
            //                 safeClassUsages[className] = 1
            //             }
            //         })
            //     })

            // this.host.classList.forEach((className) => {
            //     if (Object.prototype.hasOwnProperty.call(safeClassUsages, className)) {
            //         safeClassUsages[className]++
            //     } else {
            //         safeClassUsages[className] = 1
            //     }
            // })

            // for (const className in safeClassUsages) {
            //     if (this.classUsages.get(className) !== safeClassUsages[className]) {
            //         throw new Error(`[css] ${className} ${this.classUsages.get(className)} (correct: ${safeClassUsages[className]})`)
            //     }
            // }

            // this.classUsages.forEach((count, className) => {
            //     if (!Object.prototype.hasOwnProperty.call(safeClassUsages, className)) {
            //         throw new Error(`[css] ${className} ${count} (correct: 0)`)
            //     }
            // })
            // end: debug
        })

        this.observer.observe(this.root, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['class'],
            childList: true,
            subtree: true
        })

        if (!this.progressive) {
            (this.host as HTMLElement).style.removeProperty('display')
        }
        // @ts-ignore
        this.observing = true
        return this
    }

    hydrate(nativeCSSRules: CSSRuleList) {
        const cssLayerRules: CSSLayerBlockRule[] = []
        for (let i = 0; i < nativeCSSRules.length; i++) {
            const eachNativeCSSRule = nativeCSSRules[i]
            if (eachNativeCSSRule.constructor.name === 'CSSLayerBlockRule') {
                const eachCSSLayerRule = eachNativeCSSRule as CSSLayerBlockRule
                if ((eachNativeCSSRule as CSSLayerBlockRule).name === 'theme') {
                    this.themeLayer.native = eachCSSLayerRule
                    let variableRule: Rule | undefined
                    let lastVariableName: string | undefined
                    for (let j = 0; j < eachCSSLayerRule.cssRules.length; j++) {
                        const cssRule = eachCSSLayerRule.cssRules[j]
                        const variableCSSRule = (cssRule.constructor.name === 'CSSMediaRule'
                            ? (cssRule as CSSMediaRule).cssRules[0]
                            : cssRule) as CSSStyleRule
                        const variableName = variableCSSRule.style[0].slice(2)
                        if (variableName !== lastVariableName) {
                            lastVariableName = variableName
                            variableRule = new Rule(variableName)
                            this.themeLayer.rules.push(variableRule)
                            this.themeLayer.usages[variableRule.name] = 0
                        }
                        variableRule?.nodes.push({
                            native: cssRule,
                            text: cssRule.cssText
                        })
                    }
                    if (this.themeLayer.rules.length) this.rules.push(this.themeLayer)
                } else {
                    cssLayerRules.push(eachCSSLayerRule)
                }
            } else if (eachNativeCSSRule.constructor.name === 'CSSLayerStatementRule') {
                this.layerStatementRule.nodes[0].native = eachNativeCSSRule as CSSLayerStatementRule
            } else if (eachNativeCSSRule.constructor.name === 'CSSKeyframesRule') {
                const keyframsRule = eachNativeCSSRule as CSSKeyframesRule
                const animationRule = new Rule(keyframsRule.name, [{
                    native: keyframsRule,
                    text: keyframsRule.cssText
                }])
                this.animationsNonLayer.rules.push(animationRule)
                this.rules.push(animationRule)
                this.animationsNonLayer.usages[animationRule.name] = 0
            }
        }

        const createSyntaxRules = (cssRule: CSSStyleRule): SyntaxRule[] | undefined => {
            if (cssRule.selectorText) {
                return this.createFromSelectorText(cssRule.selectorText)
            } else if (cssRule.cssRules) {
                for (const eachCSSRule of cssRule.cssRules) {
                    const syntaxRules = createSyntaxRules(eachCSSRule as CSSStyleRule)
                    if (syntaxRules?.length) {
                        return syntaxRules
                    }
                }
            }
        }

        for (const eachCSSLayerRule of cssLayerRules) {
            const eachCSSRules = Array.from(eachCSSLayerRule.cssRules)
            let layer: SyntaxLayer
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
                default:
                    layer = this.generalLayer
                    break
            }
            layer.native = eachCSSLayerRule
            eachCSSRules.forEach((eachCSSRule) => {
                const syntaxRules = createSyntaxRules(eachCSSRule as CSSStyleRule)
                if (syntaxRules) {
                    const retrieveNative = (selectorText: string) => {
                        for (let eachTargetCSSRuleIndex = 0; eachTargetCSSRuleIndex < eachCSSRules.length; eachTargetCSSRuleIndex++) {
                            const eachTargetCSSRule = eachCSSRules[eachTargetCSSRuleIndex]
                            const matchSelector = (eachSelectorText: string) => {
                                if (eachSelectorText.replace(/,\s+/g, ',') === selectorText) {
                                    eachCSSRules.splice(eachTargetCSSRuleIndex, 1)
                                    return true
                                }
                                return false
                            }
                            if (eachTargetCSSRule instanceof CSSStyleRule) {
                                if (matchSelector(eachTargetCSSRule.selectorText!)) {
                                    return eachTargetCSSRule
                                }
                            } else if (eachTargetCSSRule instanceof CSSMediaRule) {
                                for (let eachMediaChildRuleIndex = 0; eachMediaChildRuleIndex < eachTargetCSSRule.cssRules.length; eachMediaChildRuleIndex++) {
                                    const eachMediaChildRule = eachTargetCSSRule.cssRules[eachMediaChildRuleIndex]
                                    if (eachMediaChildRule instanceof CSSStyleRule) {
                                        if (matchSelector(eachMediaChildRule.selectorText!)) {
                                            return eachTargetCSSRule
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for (const syntaxRule of syntaxRules) {
                        layer.rules.push(syntaxRule)
                        layer.insertVariables(syntaxRule)
                        layer.insertAnimations(syntaxRule)
                        syntaxRule.nodes.forEach((node) => {
                            const native = retrieveNative(node.selectorText!)
                            if (native) {
                                node.native = native
                            } else {
                                console.error(`Cannot retrieve the CSS rule for \`${node.selectorText}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                            }
                        })
                    }
                } else {
                    console.error(`Cannot recognize the CSS rule \`${eachCSSRule.cssText}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                }
            })
            for (const eachRule of layer.rules) {
                for (let k = eachRule.nodes.length - 1; k >= 0; k--) {
                    if (!eachRule.nodes[k].native) {
                        eachRule.nodes.splice(k, 1)
                    }
                }
            }
            if (layer.rules.length) this.rules.push(layer)
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
        this.classUsages.clear()
        if (!this.progressive) {
            this.style?.remove()
            this.style = null
        }
        return this
    }

    refresh(customConfig = this.customConfig) {
        if (!this.observing || !this.style!.sheet) return this
        for (let i = 1; i <= this.style!.sheet.cssRules.length - 1; i++) {
            this.style!.sheet.deleteRule(i)
        }
        super.refresh(customConfig)
        return this
    }

    destroy() {
        this.disconnect()
        runtimeCSSs.splice(runtimeCSSs.indexOf(this), 1)
        return this
    }
}

export const runtimeCSSs: RuntimeCSS[] = [];

(() => {
    globalThis.RuntimeCSS = RuntimeCSS
    globalThis.runtimeCSSs = runtimeCSSs
})()