import { MasterCSS, VariableRule, AnimationRule } from '@master/css-engine'
import type { MasterCSSPlan, MasterCSSPlanUtilityLayerName } from 'shared/master-css-plan'
import type { MasterCSSPreloaded } from '@master/css-engine'
import type { MasterCSSGeneratedRuleIR, MasterCSSRuntimeManifest } from 'shared/master-css-runtime-manifest'
import registerGlobal from './register-global'
import { HydrateResult } from './types'
import RuntimeUtilityLayer, { RuntimeUtilityLayerInstance } from './utility-layer'
import RuntimeThemeLayer from './theme-layer'
import RuntimeClassTracker from './class-tracker'
import HydratedGeneratedRule from './generated-rule'

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
    private hydrationFailureReason?: string
    observer?: MutationObserver
    progressive = false
    observing = false

    constructor(
        public root: Document | ShadowRoot = document,
        plan: MasterCSSPlan,
        preloaded?: MasterCSSPreloaded,
        public manifest?: MasterCSSRuntimeManifest
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

    private createRuntimeStyle() {
        const ownerDocument = 'createElement' in this.root ? this.root : this.root.ownerDocument
        this.style = ownerDocument.createElement('style')
        this.style.id = 'master'
        this.style.setAttribute('blocking', 'render')
        this.container.append(this.style)
    }

    private warnHydrationFallback(reason: string) {
        console.warn(`Master CSS progressive hydration requires a matching runtime manifest. ${reason} Rebuilding style#master with the runtime.`)
    }

    private useRuntimeStyle(connectedNames: Set<string>, reason?: string) {
        if (reason) this.warnHydrationFallback(reason)
        this.style?.remove()
        this.style = null
        this.progressive = false
        this.createRuntimeStyle()
        connectedNames.forEach(cls => this.add(cls))
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
                    this.progressive = true
                    break
                }
            }
        }

        // Initial scan and populate counts + snapshot
        const connectedNames = this.classTracker.collectConnected(this.root, this.classCounts)

        // Hydration or style creation
        if (this.progressive) {
            const hydrateResult = this.style?.sheet && this.hydrate(this.style.sheet.cssRules)
            if (hydrateResult) {
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
                this.useRuntimeStyle(connectedNames, this.hydrationFailureReason || 'Cannot read style#master CSS rules.')
            }
        } else {
            this.createRuntimeStyle()
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

    private failHydration(reason: string) {
        this.hydrationFailureReason = reason
        return undefined
    }

    private getManifestLayerRules() {
        const layers = new Map<MasterCSSPlanUtilityLayerName, MasterCSSGeneratedRuleIR[]>()
        if (!this.manifest?.rules?.length) return layers
        for (const rule of this.manifest.rules) {
            const layerRules = layers.get(rule.layer)
            if (layerRules) {
                layerRules.push(rule)
            } else {
                layers.set(rule.layer, [rule])
            }
        }
        return layers
    }

    private registerHydratedClassRule(className: string, rule: HydratedGeneratedRule) {
        const classUtilities = this.classUtilities as unknown as Map<string, HydratedGeneratedRule[]>
        const rules = classUtilities.get(className)
        if (rules) {
            rules.push(rule)
        } else {
            classUtilities.set(className, [rule])
        }
    }

    private getUtilityLayerByName(name: string): RuntimeUtilityLayerInstance | undefined {
        switch (name) {
            case 'base':
                return this.baseLayer
            case 'defaults':
                return this.defaultsLayer
            case 'components':
                return this.componentsLayer
            case 'utilities':
                return this.utilitiesLayer
        }
    }

    private collectManifestVariableNames() {
        const variableNames = new Set<string>()
        const collectVariableReferences = (text: string) => {
            for (const match of text.matchAll(/var\(\s*--([_a-zA-Z0-9-]+)/g)) {
                collectVariable(match[1])
            }
        }
        const collectVariable = (variableName: string, visited = new Set<string>()) => {
            if (visited.has(variableName)) return
            visited.add(variableName)
            const variable = this.variables.get(variableName)
            if (!variable) return
            variableNames.add(variableName)
            variable.dependencies?.forEach((dependency) => collectVariable(dependency, visited))
        }
        for (const rule of this.manifest?.rules || []) {
            rule.variableNames?.forEach((variableName) => collectVariable(variableName))
            collectVariableReferences(rule.text)
            rule.nodes?.forEach((node) => collectVariableReferences(node.text))
            rule.animationNames?.forEach((animationName) => {
                const keyframes = this.animations.get(animationName)
                if (!keyframes) return
                const animationRule = new AnimationRule(animationName, keyframes, this)
                animationRule.variableNames?.forEach((variableName) => collectVariable(variableName))
            })
        }
        return variableNames
    }

    private collectManifestAnimationNames() {
        const animationNames = new Set<string>()
        for (const rule of this.manifest?.rules || []) {
            rule.animationNames?.forEach((animationName) => animationNames.add(animationName))
        }
        return animationNames
    }

    private hydrateManifestVariables(nativeThemeLayer: CSSLayerBlockRule | undefined) {
        const variableRules = [...this.collectManifestVariableNames()]
            .filter((variableName) => !this.isPreloadedVariable(variableName))
            .map((variableName) => {
                const variable = this.variables.get(variableName)
                return variable && !variable.inline
                    ? new VariableRule(variableName, variable, this)
                    : undefined
            })
            .filter((rule): rule is VariableRule => Boolean(rule))
        const expectedRuleCount = variableRules.reduce((count, rule) => count + rule.nodes.length, 0)
        const nativeRuleCount = nativeThemeLayer?.cssRules.length || 0
        if (expectedRuleCount !== nativeRuleCount) return false
        if (!variableRules.length) return true
        if (!nativeThemeLayer) return false

        this.themeLayer.native = nativeThemeLayer
        let nativeIndex = 0
        for (const variableRule of variableRules) {
            for (const node of variableRule.nodes) {
                const nativeRule = nativeThemeLayer.cssRules.item(nativeIndex++)
                if (!nativeRule) return false
                node.native = nativeRule
            }
            this.themeLayer.rules.push(variableRule)
        }
        this.themeLayer.syncNativeBuckets()
        if (this.themeLayer.rules.length && !this.rules.includes(this.themeLayer)) {
            this.rules.push(this.themeLayer)
        }
        return true
    }

    private hydrateManifestAnimations(nativeKeyframesRules: Map<string, CSSKeyframesRule>) {
        const animationNames = this.collectManifestAnimationNames()
        const hydratedAnimationNames = new Set<string>()
        for (const animationName of animationNames) {
            if (this.isPreloadedAnimation(animationName)) continue
            const keyframes = this.animations.get(animationName)
            if (!keyframes) continue
            const nativeRule = nativeKeyframesRules.get(animationName)
            if (!nativeRule) return false
            const animationRule = new AnimationRule(animationName, keyframes, this)
            animationRule.native = nativeRule as unknown as CSSKeyframeRule
            this.animationsNonLayer.rules.push(animationRule)
            this.rules.push(animationRule)
            hydratedAnimationNames.add(animationName)
        }
        for (const animationName of nativeKeyframesRules.keys()) {
            if (!hydratedAnimationNames.has(animationName)) return false
        }
        return true
    }

    private hydrateManifestLayer(
        layer: RuntimeUtilityLayerInstance,
        nativeLayerRule: CSSLayerBlockRule,
        manifestRules: MasterCSSGeneratedRuleIR[],
        result: HydrateResult
    ) {
        const expectedRuleCount = manifestRules.reduce((count, rule) => count + (rule.nodes?.length || 1), 0)
        if (expectedRuleCount !== nativeLayerRule.cssRules.length) return false

        layer.native = nativeLayerRule
        let nativeIndex = 0
        for (const manifestRule of manifestRules) {
            const hydratedRule = new HydratedGeneratedRule(manifestRule, layer)
            const nodes = hydratedRule.nodes
            if (nodes?.length) {
                for (const node of nodes) {
                    node.native = nativeLayerRule.cssRules.item(nativeIndex++) || undefined
                }
            } else {
                hydratedRule.native = nativeLayerRule.cssRules.item(nativeIndex++) || undefined
            }

            layer.rules.push(hydratedRule)
            layer.insertVariables(hydratedRule)
            layer.insertAnimations(hydratedRule)
            this.registerHydratedClassRule(manifestRule.className, hydratedRule)
            result.allUtilities.push(hydratedRule)
        }

        if (layer.rules.length && !this.rules.includes(layer)) {
            this.rules.push(layer)
        }
        return true
    }

    hydrate(nativeLayerRules: CSSRuleList) {
        this.hydrationFailureReason = undefined
        if (this.manifest?.version !== 1 || !Array.isArray(this.manifest.rules)) {
            return this.failHydration('Missing or invalid runtime manifest.')
        }
        if (!this.manifest.rules.length) {
            return this.failHydration('Runtime manifest has no generated rules for style#master.')
        }

        const result: HydrateResult = {
            allUtilities: []
        }
        const manifestLayerRules = this.getManifestLayerRules()
        const nativeUtilityLayerRules = new Map<MasterCSSPlanUtilityLayerName, CSSLayerBlockRule>()
        const nativeKeyframesRules = new Map<string, CSSKeyframesRule>()
        let nativeThemeLayer: CSSLayerBlockRule | undefined

        for (let i = 0; i < nativeLayerRules.length; i++) {
            const eachNativeCSSRule = nativeLayerRules[i]
            if (eachNativeCSSRule.constructor.name === 'CSSLayerBlockRule') {
                const eachCSSLayerRule = eachNativeCSSRule as CSSLayerBlockRule
                if (eachCSSLayerRule.name === 'theme') {
                    if (nativeThemeLayer) return this.failHydration('Duplicate theme layer in style#master.')
                    nativeThemeLayer = eachCSSLayerRule
                    continue
                }
                const layer = this.getUtilityLayerByName(eachCSSLayerRule.name)
                if (!layer) return this.failHydration(`Unknown layer \`${eachCSSLayerRule.name}\` in style#master.`)
                if (nativeUtilityLayerRules.has(layer.name as MasterCSSPlanUtilityLayerName)) {
                    return this.failHydration(`Duplicate layer \`${eachCSSLayerRule.name}\` in style#master.`)
                }
                nativeUtilityLayerRules.set(layer.name as MasterCSSPlanUtilityLayerName, eachCSSLayerRule)
            } else if (eachNativeCSSRule.constructor.name === 'CSSKeyframesRule') {
                const nativeKeyframesRule = eachNativeCSSRule as CSSKeyframesRule
                nativeKeyframesRules.set(nativeKeyframesRule.name, nativeKeyframesRule)
            } else {
                return this.failHydration(`Unknown top-level rule \`${eachNativeCSSRule.cssText}\` in style#master.`)
            }
        }

        for (const [layerName, manifestRules] of manifestLayerRules) {
            const nativeLayerRule = nativeUtilityLayerRules.get(layerName)
            if (!nativeLayerRule) return this.failHydration(`Missing layer \`${layerName}\` in style#master.`)
            const expectedRuleCount = manifestRules.reduce((count, rule) => count + (rule.nodes?.length || 1), 0)
            if (expectedRuleCount !== nativeLayerRule.cssRules.length) {
                return this.failHydration(`Layer \`${layerName}\` does not match the runtime manifest.`)
            }
        }

        for (const [layerName, nativeLayerRule] of nativeUtilityLayerRules) {
            if (!manifestLayerRules.has(layerName) && nativeLayerRule.cssRules.length) {
                return this.failHydration(`Layer \`${layerName}\` has no runtime manifest rules.`)
            }
        }

        if (!this.hydrateManifestVariables(nativeThemeLayer)) {
            return this.failHydration('Theme layer does not match the runtime manifest.')
        }
        if (!this.hydrateManifestAnimations(nativeKeyframesRules)) {
            return this.failHydration('Keyframes do not match the runtime manifest.')
        }

        for (const [layerName, nativeLayerRule] of nativeUtilityLayerRules) {
            const manifestRules = manifestLayerRules.get(layerName)
            if (!manifestRules?.length) continue
            const layer = this.getUtilityLayerByName(layerName)!
            this.hydrateManifestLayer(layer, nativeLayerRule, manifestRules, result)
        }

        globalThis.__MASTER_CSS_DEVTOOLS_HOOK__?.emit('runtime:hydrated', { cssRuntime: this, result })
        return result
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
