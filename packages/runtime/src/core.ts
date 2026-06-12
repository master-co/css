import MasterCSS from '@master/css-engine/core'
import VariableRule from '@master/css-engine/variable-rule'
import AnimationRule from '@master/css-engine/animation-rule'
import type { UtilityLayerName } from 'shared/css-config'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import type { MasterCSSPreloaded } from '@master/css-engine/preloaded'
import registerGlobal from './register-global'
import { HydrateResult } from './types'
import RuntimeLayer from './layer'
import RuntimeUtilityLayer, { RuntimeUtilityLayerInstance } from './utility-layer'
import RuntimeThemeLayer from './theme-layer'
import RuntimeClassTracker from './class-tracker'

function getCSSRuleText(cssRule: CSSRule) {
    return cssRule.cssText.trim()
}

export default class CSSRuntime extends MasterCSS {
    static instances = new WeakMap<Document | ShadowRoot, CSSRuntime>()
    readonly host: Element
    readonly container: HTMLElement | ShadowRoot
    readonly baseLayer = new RuntimeUtilityLayer('base', this)
    readonly themeLayer = new RuntimeThemeLayer('theme', this)
    readonly defaultsLayer = new RuntimeUtilityLayer('defaults', this)
    readonly componentsLayer = new RuntimeUtilityLayer('components', this)
    readonly utilitiesLayer = new RuntimeUtilityLayer('utilities', this)
    readonly classCounts = new Map<string, number>()
    private readonly classTracker = new RuntimeClassTracker()
    observer?: MutationObserver
    progressive = false
    observing = false

    constructor(
        public root: Document | ShadowRoot = document,
        plan: MasterCSSPlan = { version: 1 },
        preloaded?: MasterCSSPreloaded
    ) {
        super(plan, preloaded)
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

        // Initial scan and populate counts + snapshot
        const connectedNames = this.classTracker.collectConnected(this.root, this.classCounts)

        // Hydration or style creation
        if (this.progressive) {
            const hydrateResult = this.hydrate(this.style!.sheet!.cssRules)
            const hydratedClassNames = new Set(hydrateResult.allUtilities.map(({ fixedClass, name }) => fixedClass || name))
            for (const cls of connectedNames) {
                if (!hydratedClassNames.has(cls)) {
                    this.add(cls)
                    if (process.env.NODE_ENV === 'development') {
                        console.debug(`Missing prerendered rule for class \`${cls}\``)
                    }
                }
            }
        } else {
            const ownerDocument = 'createElement' in this.root ? this.root : this.root.ownerDocument
            this.style = ownerDocument.createElement('style')
            this.style.id = 'master'
            this.style.setAttribute('blocking', 'render')
            this.container.append(this.style)
            connectedNames.forEach(cls => this.add(cls))
        }

        this.observer = new MutationObserver(records => {
            const deltaCounts = this.classTracker.collectMutations(records)
            const addedClassNames: string[] = []
            const removedClassNames: string[] = []

            for (const [cls, change] of deltaCounts) {
                const current = this.classCounts.get(cls) || 0
                const next = current + change
                if (next > 0) {
                    this.classCounts.set(cls, next)
                    if (current === 0) addedClassNames.push(cls)
                } else {
                    this.classCounts.delete(cls)
                    removedClassNames.push(cls)
                }
            }

            if (addedClassNames.length) this.add(...addedClassNames)
            if (removedClassNames.length) this.remove(...removedClassNames)

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
            allUtilities: []
        }
        for (let i = 0; i < nativeLayerRules.length; i++) {
            const eachNativeCSSRule = nativeLayerRules[i]
            if (eachNativeCSSRule.constructor.name === 'CSSLayerBlockRule') {
                const eachCSSLayerRule = eachNativeCSSRule as CSSLayerBlockRule
                if ((eachNativeCSSRule as CSSLayerBlockRule).name === 'theme') {
                    this.themeLayer.native = eachCSSLayerRule
                    const hydratedVariableNames = new Set(this.themeLayer.rules.map(({ name }) => name))
                    const hydrateStyleRule = (styleRule: CSSStyleRule) => {
                        for (let i = 0; i < styleRule.style.length; i++) {
                            const propertyName = styleRule.style.item(i)
                            if (!propertyName.startsWith('--')) continue
                            const variableName = propertyName.slice(2)
                            if (hydratedVariableNames.has(variableName)) continue
                            const variable = this.variables.get(variableName)
                            if (!variable) continue
                            const variableRule = new VariableRule(variableName, variable, this)
                            this.themeLayer.rules.push(variableRule)
                            this.themeLayer.tokenCounts.set(variableRule.name, 0)
                            hydratedVariableNames.add(variableRule.name)
                        }
                    }
                    for (const cssRule of eachCSSLayerRule.cssRules) {
                        if (cssRule instanceof CSSStyleRule) {
                            hydrateStyleRule(cssRule)
                        } else if (cssRule instanceof CSSGroupingRule) {
                            for (const childRule of cssRule.cssRules) {
                                if (childRule instanceof CSSStyleRule) hydrateStyleRule(childRule)
                            }
                        }
                    }
                    this.themeLayer.syncNativeBuckets()
                    if (this.themeLayer.rules.length) this.rules.push(this.themeLayer)
                } else {
                    cssLayerRules.push(eachCSSLayerRule)
                }
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
            let layer: RuntimeUtilityLayerInstance
            switch (eachCSSLayerRule.name) {
                case 'base':
                    layer = this.baseLayer
                    break
                case 'defaults':
                    layer = this.defaultsLayer
                    break
                case 'components':
                    layer = this.componentsLayer
                    break
                case 'utilities':
                    layer = this.utilitiesLayer
                    break
                default:
                    console.error(`Cannot recognize the layer \`${eachCSSLayerRule.name}\`. (https://rc.css.master.co/messages/hydration-errors)`)
                    continue
            }
            layer.native = eachCSSLayerRule
            const unresolvedCSSRules = new Map<string, CSSRule>()
            for (const rule of eachCSSLayerRule.cssRules) {
                // trim() for fix the firefox bug that the cssText ends with \n\n
                unresolvedCSSRules.set(getCSSRuleText(rule), rule)
            }

            for (const eachNativeLayerRule of eachCSSLayerRule.cssRules) {
                if (!unresolvedCSSRules.has(getCSSRuleText(eachNativeLayerRule))) continue
                const selectorText = this.getSelectorText(eachNativeLayerRule)
                if (!selectorText) {
                    console.error(`Cannot get the selector text from \`${eachNativeLayerRule.cssText}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                    continue
                }
                const createdUtilities = this.createFromSelectorText(selectorText, layer.name as UtilityLayerName)
                if (createdUtilities) {
                    for (const createdUtility of createdUtilities) {
                        layer.rules.push(createdUtility)
                        layer.insertVariables(createdUtility)
                        layer.insertAnimations(createdUtility)
                        result.allUtilities.push(createdUtility)
                        const nodes = Array.isArray(createdUtility.nodes)
                            ? createdUtility.nodes
                            : [createdUtility]
                        for (const node of nodes) {
                            try {
                                const checkRuleIndex = checkSheet.insertRule(node.text)
                                try {
                                    const checkNodeNativeRule = checkSheet.cssRules.item(checkRuleIndex)
                                    if (checkNodeNativeRule) {
                                        const checkNodeNativeRuleText = getCSSRuleText(checkNodeNativeRule)
                                        const match = unresolvedCSSRules.get(checkNodeNativeRuleText)
                                        if (match) {
                                            node.native = match
                                            unresolvedCSSRules.delete(checkNodeNativeRuleText)
                                            continue
                                        }
                                    }
                                } finally {
                                    checkSheet.deleteRule(checkRuleIndex)
                                }
                                console.error(`Cannot retrieve CSS rule for \`${node.text}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                            } catch (error) {
                                if (process.env.NODE_ENV === 'development') {
                                    console.debug(`Cannot insert CSS rule for \`${node.text}\`. (${layer.name}) (https://rc.css.master.co/messages/hydration-errors)`)
                                }
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
        this.loadPlan(this.plan)
        this.classCounts.clear()
        this.classTracker.reset()
        if (!this.progressive) {
            this.style?.remove()
            this.style = null
        }
        globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:disconnected', { cssRuntime: this })
        return this
    }

    refresh(plan: MasterCSSPlan = this.plan) {
        if (!this.observing || !this.style!.sheet) return this
        const cssRules = this.style!.sheet.cssRules
        for (let i = cssRules.length - 1; i >= 0; i--) {
            this.style!.sheet.deleteRule(i)
        }
        super.refresh(plan)
        /**
         * Recreate rules from the current class names against the latest plan.
         * 所以 refresh 過後 rules 可能會變多也可能會變少
         */
        this.classCounts.forEach((_, className) => {
            this.add(className)
        })
        globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:refreshed', { cssRuntime: this, plan })
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
