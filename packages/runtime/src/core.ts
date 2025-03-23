import { MasterCSS, config as defaultConfig, Rule } from '@master/css'
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

    constructor(
        public root: Document | ShadowRoot = document,
        public customConfig: Config = defaultConfig
    ) {
        super(customConfig)
        const rootConstructorName = root?.constructor.name
        if (rootConstructorName === 'HTMLDocument' || rootConstructorName === 'Document') {
            (this.root as Document).defaultView!.globalThis.cssRuntime = this
            this.container = (this.root as Document).head
            this.host = (this.root as Document).documentElement
        } else {
            this.container = this.root as CSSRuntime['container']
            this.host = (this.root as ShadowRoot).host
        }
        this.supportVendors = new Set()
        const styleDeclaration = document.documentElement.style
        if ('webkitTransform' in styleDeclaration) this.supportVendors.add('webkit')
        if ('MozTransform' in styleDeclaration) this.supportVendors.add('moz')
        if ('msTransform' in styleDeclaration) this.supportVendors.add('ms')
        if ('OTransform' in styleDeclaration) this.supportVendors.add('o')
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
                    // @ts-ignore
                    this.progressive = true
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

        this.host.classList.forEach(increaseClassCount);

        ((this.root.constructor.name === 'HTMLDocument') ? this.host : this.container)
            .querySelectorAll('[class]')
            .forEach((element) => element.classList.forEach(increaseClassCount))

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
            this.layerStatementRule.nodes[0].native = this.style!.sheet!.cssRules.item(0) as CSSLayerStatementRule
            for (const eachConnectedName of connectedNames) {
                this.add(eachConnectedName)
            }
        }

        // @ts-expect-error readonly
        this.observer = new MutationObserver((mutationRecords) => {
            // console.clear()
            // const test = ''
            // if (test) {
            //     console.log('')
            //     console.log(`${test}: ${this.classCounts.get(test)}`)
            // }
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
                    updateClassCount(addedClasses, true)
                }
                if (removedClasses.length) {
                    // console.log('[attribute]', '[remove]', removedClasses, target)
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
            childList: true,
            subtree: true
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
        for (const eachCSSLayerRule of cssLayerRules) {
            const nativeLayerRules = Array.from(eachCSSLayerRule.cssRules)
            // TODO: type error
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
            for (const eachNativeRule of nativeLayerRules) {
                const selectorText = this.getSelectorText(eachNativeRule)
                if (!selectorText) {
                    console.error(`Cannot get the selector text from \`${eachNativeRule.cssText}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                    continue
                }
                const createdRules = this.createFromSelectorText(selectorText)
                if (createdRules) {
                    for (const createdRule of createdRules) {
                        layer.rules.push(createdRule)
                        layer.insertVariables(createdRule)
                        layer.insertAnimations(createdRule)
                        result.allSyntaxRules.push(createdRule)
                        createdRule.nodes.forEach((node) => {
                            const createdNodeNativeRule = checkSheet.cssRules.item(checkSheet.insertRule(node.text))
                            if (createdNodeNativeRule) {
                                for (const eachFindingNativeRule of nativeLayerRules) {
                                    if (createdNodeNativeRule.cssText === eachFindingNativeRule.cssText) {
                                        node.native = eachFindingNativeRule
                                        nativeLayerRules.splice(nativeLayerRules.indexOf(eachFindingNativeRule), 1)
                                        return
                                    }
                                }
                            }
                            console.error(`Cannot retrieve CSS rule for \`${node.selectorText}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                        })
                    }
                } else {
                    console.error(`Cannot recognize \`${eachNativeRule.cssText}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                }
            }
            if (layer.rules.length) this.rules.push(layer)
        }
        globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:hydrated', { cssRuntime: this, result })
        return result
    }

    getSelectorText(cssRule: CSSRule): string | undefined {
        if ('selectorText' in cssRule) {
            return cssRule.selectorText as string
        } else if ('cssRules' in cssRule) {
            return this.getSelectorText((cssRule.cssRules as CSSRuleList).item(0)!)
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