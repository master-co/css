import { MasterCSS, VariableRule, AnimationRule } from '@master/css-engine'
import type { MasterCSSManifest, MasterCSSManifestUtilityLayerName } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-engine'
import {
    MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
    type MasterCSSGeneratedRuleIR,
    type MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import registerGlobal from './register-global'
import { HydrateResult } from './types'
import RuntimeUtilityLayer, { RuntimeUtilityLayerInstance } from './utility-layer'
import RuntimeThemeLayer from './theme-layer'
import RuntimeClassTracker from './class-tracker'
import HydratedGeneratedRule from './generated-rule'
import { browserNativeDeclarationMatcher } from './native-declaration'
import {
    debugRuntimeCreated,
    debugRuntimeDestroyed,
    debugRuntimeDisconnected,
    debugRuntimeHydrated,
    debugRuntimeMutation,
    debugRuntimeObserved,
    debugRuntimeRefreshed
} from './debuggers'

const MASTER_CSS_RUNTIME_STYLE_SELECTOR = `style#${MASTER_CSS_RUNTIME_STYLE_ID}`

export interface CSSRuntimeCreateOptions {
    manifest: MasterCSSManifest
    root?: Document | ShadowRoot
    emittedGlobals?: MasterCSSEmittedGlobals
    hydrationManifest?: MasterCSSHydrationManifest
}

function isDocumentRoot(root: Document | ShadowRoot): root is Document {
    const rootConstructorName = root?.constructor.name
    return rootConstructorName === 'HTMLDocument' || rootConstructorName === 'Document'
}

function findElementById(root: Document | ShadowRoot, id: string) {
    return isDocumentRoot(root)
        ? root.getElementById(id)
        : 'querySelector' in root
            ? root.querySelector(`#${id}`)
            : undefined
}

function parseHydrationManifest(source: string): MasterCSSHydrationManifest | undefined {
    try {
        const hydrationManifest = JSON.parse(source) as MasterCSSHydrationManifest
        return hydrationManifest?.version === 1 && Array.isArray(hydrationManifest.rules)
            ? hydrationManifest
            : undefined
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.debug('Cannot parse Master CSS hydration manifest.', error)
        }
    }
}

function readInlineHydrationManifest(root: Document | ShadowRoot): MasterCSSHydrationManifest | undefined {
    const element = findElementById(root, MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
    const source = element?.textContent?.trim()
    if (!source) return
    return parseHydrationManifest(source)
}

function readExternalHydrationManifestSource(root: Document | ShadowRoot) {
    const styleElement = findElementById(root, MASTER_CSS_RUNTIME_STYLE_ID)
    const HTMLStyleElementConstructor = globalThis.HTMLStyleElement
    return HTMLStyleElementConstructor && styleElement instanceof HTMLStyleElementConstructor
        ? styleElement.getAttribute(MASTER_CSS_HYDRATION_MANIFEST_ATTR)
        : undefined
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
    private readonly pendingRemovedClassNames = new Set<string>()
    private pendingRemovalFrame: number | undefined
    private pendingRemovalFlushFrame: number | undefined
    private hydrationFailureReason?: string
    observer?: MutationObserver
    progressive = false
    observing = false

    static create(options: CSSRuntimeCreateOptions): CSSRuntime {
        const {
            manifest,
            root = document,
            emittedGlobals,
            hydrationManifest
        } = options
        const resolvedHydrationManifest = hydrationManifest === undefined
            ? readInlineHydrationManifest(root)
            : hydrationManifest
        const current = globalThis.MasterCSSRuntime.instances.get(root)
        if (current) {
            current.registerEmittedGlobals(emittedGlobals)
            if (resolvedHydrationManifest !== undefined) current.setHydrationManifest(resolvedHydrationManifest)
            return current
        }
        return new CSSRuntime(root, manifest, emittedGlobals, resolvedHydrationManifest).register()
    }

    constructor(
        public root: Document | ShadowRoot = document,
        manifest: MasterCSSManifest,
        emittedGlobals?: MasterCSSEmittedGlobals,
        public hydrationManifest?: MasterCSSHydrationManifest
    ) {
        super(manifest, emittedGlobals, {
            nativeDeclarationMatcher: browserNativeDeclarationMatcher
        })
        if (isDocumentRoot(root)) {
            this.container = root.head
            this.host = root.documentElement
        } else {
            this.container = this.root as CSSRuntime['container']
            this.host = (this.root as ShadowRoot).host
        }
        this.applyEmittedGlobalsCounts({
            variables: this.emittedGlobals.variables
        })
    }

    register(): this {
        const registered = globalThis.MasterCSSRuntime.instances.get(this.root) === this
        globalThis.MasterCSSRuntime.instances.set(this.root, this)
        if (isDocumentRoot(this.root)) {
            this.root.defaultView!.globalThis.masterCSSRuntime = this
        }
        if (!registered && process.env.NODE_ENV === 'development') {
            debugRuntimeCreated(this)
        }
        return this
    }

    unregister(): this {
        globalThis.MasterCSSRuntime.instances.delete(this.root)
        if (isDocumentRoot(this.root) && this.root.defaultView!.globalThis.masterCSSRuntime === this) {
            this.root.defaultView!.globalThis.masterCSSRuntime = undefined as unknown as CSSRuntime
        }
        return this
    }

    setHydrationManifest(hydrationManifest?: MasterCSSHydrationManifest): this {
        this.hydrationManifest = hydrationManifest
        return this
    }

    needsHydrationManifest(): boolean {
        return this.hydrationManifest === undefined && Boolean(readExternalHydrationManifestSource(this.root))
    }

    async loadHydrationManifest(): Promise<this> {
        const inlineHydrationManifest = readInlineHydrationManifest(this.root)
        if (inlineHydrationManifest) {
            this.setHydrationManifest(inlineHydrationManifest)
            return this
        }

        const source = readExternalHydrationManifestSource(this.root)
        if (!source) return this

        try {
            const response = await fetch(source, { credentials: 'same-origin' })
            if (!response.ok) return this
            this.setHydrationManifest(parseHydrationManifest(await response.text()))
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.debug('Cannot load Master CSS hydration manifest.', error)
            }
        }

        return this
    }

    private createRuntimeStyle() {
        const ownerDocument = 'createElement' in this.root ? this.root : this.root.ownerDocument
        this.style = ownerDocument.createElement('style')
        this.style.id = MASTER_CSS_RUNTIME_STYLE_ID
        this.style.setAttribute('blocking', 'render')
        this.container.append(this.style)
    }

    private warnHydrationFallback(reason: string) {
        console.warn(`Master CSS progressive hydration requires a matching hydration manifest. ${reason} Rebuilding ${MASTER_CSS_RUNTIME_STYLE_SELECTOR} with the runtime.`)
    }

    private useRuntimeStyle(connectedNames: Set<string>, reason?: string) {
        if (reason) this.warnHydrationFallback(reason)
        this.style?.remove()
        this.style = null
        this.progressive = false
        this.createRuntimeStyle()
        this.insertStaticResources()
        connectedNames.forEach(cls => this.add(cls))
    }

    private detectRuntimeStyle() {
        if (this.root.styleSheets) {
            for (const sheet of this.root.styleSheets) {
                const { ownerNode } = sheet
                if (ownerNode instanceof HTMLStyleElement && ownerNode.id === MASTER_CSS_RUNTIME_STYLE_ID) {
                    this.style = ownerNode
                    this.progressive = true
                    break
                }
            }
        }
    }

    private collectConnectedClasses() {
        return this.classTracker.collectConnected(this.root, this.classCounts)
    }

    private hydrateRuntimeStyle(connectedNames: Set<string>) {
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
            this.useRuntimeStyle(connectedNames, this.hydrationFailureReason || `Cannot read ${MASTER_CSS_RUNTIME_STYLE_SELECTOR} CSS rules.`)
        }
    }

    private renderRuntimeStyle(connectedNames: Set<string>) {
        this.createRuntimeStyle()
        this.insertStaticResources()
        connectedNames.forEach(cls => this.add(cls))
    }

    private getAnimationFrameWindow() {
        const ownerDocument = isDocumentRoot(this.root)
            ? this.root
            : this.root.ownerDocument
        return ownerDocument?.defaultView || globalThis
    }

    private cancelPendingRemovalFrames() {
        const view = this.getAnimationFrameWindow()
        if (this.pendingRemovalFrame !== undefined) {
            view.cancelAnimationFrame(this.pendingRemovalFrame)
            this.pendingRemovalFrame = undefined
        }
        if (this.pendingRemovalFlushFrame !== undefined) {
            view.cancelAnimationFrame(this.pendingRemovalFlushFrame)
            this.pendingRemovalFlushFrame = undefined
        }
    }

    private clearPendingRemovedClassNames() {
        this.pendingRemovedClassNames.clear()
        this.cancelPendingRemovalFrames()
    }

    private cancelPendingRemovedClassNames(classNames: Iterable<string>) {
        if (!this.pendingRemovedClassNames.size) return
        for (const className of classNames) {
            this.pendingRemovedClassNames.delete(className)
        }
        if (!this.pendingRemovedClassNames.size) this.cancelPendingRemovalFrames()
    }

    private schedulePendingRemovalFlush() {
        if (!this.pendingRemovedClassNames.size) return
        if (this.pendingRemovalFrame !== undefined || this.pendingRemovalFlushFrame !== undefined) return
        const view = this.getAnimationFrameWindow()
        this.pendingRemovalFrame = view.requestAnimationFrame(() => {
            this.pendingRemovalFrame = undefined
            this.pendingRemovalFlushFrame = view.requestAnimationFrame(() => {
                this.pendingRemovalFlushFrame = undefined
                this.flushPendingRemovedClassNames()
            })
        })
    }

    private queueRemovedClassNames(classNames: Iterable<string>) {
        for (const className of classNames) {
            if (!this.classCounts.has(className)) this.pendingRemovedClassNames.add(className)
        }
        this.schedulePendingRemovalFlush()
    }

    private flushPendingRemovedClassNames() {
        if (!this.pendingRemovedClassNames.size) return
        const classNames: string[] = []
        for (const className of this.pendingRemovedClassNames) {
            if (!this.classCounts.has(className)) classNames.push(className)
        }
        this.pendingRemovedClassNames.clear()
        if (classNames.length) super.remove(...classNames)
    }

    private handleMutationRecords(records: MutationRecord[]) {
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
        if (removedClassNames.length) this.queueRemovedClassNames(removedClassNames)

        if (process.env.NODE_ENV === 'development') {
            debugRuntimeMutation(records, deltaCounts, this)
        }
    }

    add(...classNames: string[]) {
        this.cancelPendingRemovedClassNames(classNames)
        return super.add(...classNames)
    }

    remove(...classNames: string[]) {
        this.cancelPendingRemovedClassNames(classNames)
        super.remove(...classNames)
    }

    private startMutationObserver() {
        this.observer = new MutationObserver(records => this.handleMutationRecords(records))

        this.observer.observe(this.root, {
            childList: true,
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        })
    }

    private revealHostIfNeeded() {
        if (!this.progressive) this.host.removeAttribute('hidden')
    }

    /**
     * Observe the DOM for changes and update the running stylesheet. (browser only)
     * @param options mutation observer options
     * @returns this
     */
    observe(): this {
        if (this.observing) return this

        this.detectRuntimeStyle()
        const connectedNames = this.collectConnectedClasses()

        if (this.progressive) {
            this.hydrateRuntimeStyle(connectedNames)
        } else {
            this.renderRuntimeStyle(connectedNames)
        }

        this.startMutationObserver()
        this.revealHostIfNeeded()
        this.observing = true
        if (process.env.NODE_ENV === 'development') {
            debugRuntimeObserved(this)
        }
        return this
    }

    private failHydration(reason: string) {
        this.hydrationFailureReason = reason
        return undefined
    }

    private getHydrationManifestLayerRules() {
        const layers = new Map<MasterCSSManifestUtilityLayerName, MasterCSSGeneratedRuleIR[]>()
        if (!this.hydrationManifest?.rules?.length) return layers
        for (const rule of this.hydrationManifest.rules) {
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

    private collectHydrationManifestVariableNames() {
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
        for (const rule of this.hydrationManifest?.rules || []) {
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
        for (const [variableName, variable] of this.variables) {
            if (variable.static) collectVariable(variableName)
        }
        return variableNames
    }

    private collectHydrationManifestAnimationNames() {
        const animationNames = new Set<string>()
        for (const rule of this.hydrationManifest?.rules || []) {
            rule.animationNames?.forEach((animationName) => animationNames.add(animationName))
        }
        for (const animationName of this.animations.keys()) {
            if (this.manifest.animationOptions?.[animationName]?.static) animationNames.add(animationName)
        }
        return animationNames
    }

    private nativeThemeLayerHasOnlyEmittedGlobalsVariables(nativeThemeLayer: CSSLayerBlockRule | undefined) {
        if (!nativeThemeLayer) return false
        let found = false
        for (const nativeRule of nativeThemeLayer.cssRules) {
            const styleRule = this.themeLayer.getStyleRule(nativeRule)
            if (!styleRule) return false
            for (let index = 0; index < styleRule.style.length; index++) {
                const propertyName = styleRule.style.item(index)
                if (this.isSyntheticColorSchemeDeclaration(nativeRule, styleRule, propertyName)) continue
                if (!propertyName.startsWith('--')) return false
                found = true
                if (!this.isEmittedGlobalsVariable(propertyName.slice(2))) return false
            }
        }
        return found
    }

    private getVariableRuleBuckets(variableRules: VariableRule[]) {
        const buckets = new Map<string, {
            mediaText: string
            mode?: string
            selectorText: string
            nodes: VariableRule['nodes'][number][]
        }>()
        for (const rule of variableRules) {
            for (const node of rule.nodes) {
                const key = this.themeLayer.getBucketKey(node.mediaText, node.selectorText)
                let bucket = buckets.get(key)
                if (!bucket) {
                    bucket = {
                        mediaText: node.mediaText,
                        mode: node.mode,
                        selectorText: node.selectorText,
                        nodes: []
                    }
                    buckets.set(key, bucket)
                }
                bucket.nodes.push(node)
            }
        }
        return Array.from(buckets.values())
    }

    private isSyntheticColorSchemeDeclaration(nativeRule: CSSRule, styleRule: CSSStyleRule, propertyName: string) {
        if (propertyName !== 'color-scheme') return false
        const colorScheme = styleRule.style.getPropertyValue(propertyName).trim()
        return colorScheme === this.themeLayer.getBucketColorScheme({
            mediaText: nativeRule instanceof CSSMediaRule ? `@media ${nativeRule.conditionText}` : '',
            mode: colorScheme,
            selectorText: styleRule.selectorText
        })
    }

    private getNativeThemeRuleBucketKey(nativeRule: CSSRule) {
        const styleRule = this.themeLayer.getStyleRule(nativeRule)
        if (!styleRule) return
        const mediaText = nativeRule instanceof CSSMediaRule
            ? `@media ${nativeRule.conditionText}`
            : ''
        return {
            key: this.themeLayer.getBucketKey(mediaText, styleRule.selectorText),
            styleRule
        }
    }

    private hydrateHydrationManifestVariables(nativeThemeLayer: CSSLayerBlockRule | undefined) {
        const variableRules = [...this.collectHydrationManifestVariableNames()]
            .filter((variableName) => !this.isEmittedGlobalsVariable(variableName))
            .map((variableName) => {
                const variable = this.variables.get(variableName)
                return variable && !variable.inline
                    ? new VariableRule(variableName, variable, this)
                    : undefined
            })
            .filter((rule): rule is VariableRule => Boolean(rule))
        const expectedBuckets = this.getVariableRuleBuckets(variableRules)
        const nativeRuleCount = nativeThemeLayer?.cssRules.length || 0
        if (expectedBuckets.length !== nativeRuleCount) {
            return !variableRules.length && this.nativeThemeLayerHasOnlyEmittedGlobalsVariables(nativeThemeLayer)
        }
        if (!variableRules.length) return true
        if (!nativeThemeLayer) return false

        this.themeLayer.native = nativeThemeLayer
        const nativeBuckets = new Map<string, CSSStyleRule>()
        for (const nativeRule of nativeThemeLayer.cssRules) {
            const nativeBucket = this.getNativeThemeRuleBucketKey(nativeRule)
            if (!nativeBucket || nativeBuckets.has(nativeBucket.key)) return false
            nativeBuckets.set(nativeBucket.key, nativeBucket.styleRule)
        }
        for (const bucket of expectedBuckets) {
            const nativeStyleRule = nativeBuckets.get(this.themeLayer.getBucketKey(bucket.mediaText, bucket.selectorText))
            if (!nativeStyleRule) return false
            for (const node of bucket.nodes) {
                node.native = nativeStyleRule
            }
        }
        this.themeLayer.rules.push(...variableRules)
        this.themeLayer.syncNativeBuckets()
        if (this.themeLayer.rules.length && !this.rules.includes(this.themeLayer)) {
            this.rules.push(this.themeLayer)
        }
        return true
    }

    private hydrateHydrationManifestAnimations(nativeKeyframesRules: Map<string, CSSKeyframesRule>) {
        const animationNames = this.collectHydrationManifestAnimationNames()
        const hydratedAnimationNames = new Set<string>()
        for (const animationName of animationNames) {
            if (this.isEmittedGlobalsAnimation(animationName)) {
                if (nativeKeyframesRules.has(animationName)) hydratedAnimationNames.add(animationName)
                continue
            }
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

    private hydrateHydrationManifestLayer(
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
        if (this.hydrationManifest?.version !== 1 || !Array.isArray(this.hydrationManifest.rules)) {
            return this.failHydration('Missing or invalid hydration manifest.')
        }
        if (!this.hydrationManifest.rules.length) {
            return this.failHydration(`Hydration manifest has no generated rules for ${MASTER_CSS_RUNTIME_STYLE_SELECTOR}.`)
        }

        const result: HydrateResult = {
            allUtilities: []
        }
        const manifestLayerRules = this.getHydrationManifestLayerRules()
        const nativeUtilityLayerRules = new Map<MasterCSSManifestUtilityLayerName, CSSLayerBlockRule>()
        const nativeKeyframesRules = new Map<string, CSSKeyframesRule>()
        let nativeThemeLayer: CSSLayerBlockRule | undefined

        for (let i = 0; i < nativeLayerRules.length; i++) {
            const eachNativeCSSRule = nativeLayerRules[i]
            if (eachNativeCSSRule.constructor.name === 'CSSLayerBlockRule') {
                const eachCSSLayerRule = eachNativeCSSRule as CSSLayerBlockRule
                if (eachCSSLayerRule.name === 'theme') {
                    if (nativeThemeLayer) return this.failHydration(`Duplicate theme layer in ${MASTER_CSS_RUNTIME_STYLE_SELECTOR}.`)
                    nativeThemeLayer = eachCSSLayerRule
                    continue
                }
                const layer = this.getUtilityLayerByName(eachCSSLayerRule.name)
                if (!layer) return this.failHydration(`Unknown layer \`${eachCSSLayerRule.name}\` in ${MASTER_CSS_RUNTIME_STYLE_SELECTOR}.`)
                if (nativeUtilityLayerRules.has(layer.name as MasterCSSManifestUtilityLayerName)) {
                    return this.failHydration(`Duplicate layer \`${eachCSSLayerRule.name}\` in ${MASTER_CSS_RUNTIME_STYLE_SELECTOR}.`)
                }
                nativeUtilityLayerRules.set(layer.name as MasterCSSManifestUtilityLayerName, eachCSSLayerRule)
            } else if (eachNativeCSSRule.constructor.name === 'CSSKeyframesRule') {
                const nativeKeyframesRule = eachNativeCSSRule as CSSKeyframesRule
                nativeKeyframesRules.set(nativeKeyframesRule.name, nativeKeyframesRule)
            } else {
                return this.failHydration(`Unknown top-level rule \`${eachNativeCSSRule.cssText}\` in ${MASTER_CSS_RUNTIME_STYLE_SELECTOR}.`)
            }
        }

        for (const [layerName, manifestRules] of manifestLayerRules) {
            const nativeLayerRule = nativeUtilityLayerRules.get(layerName)
            if (!nativeLayerRule) return this.failHydration(`Missing layer \`${layerName}\` in ${MASTER_CSS_RUNTIME_STYLE_SELECTOR}.`)
            const expectedRuleCount = manifestRules.reduce((count, rule) => count + (rule.nodes?.length || 1), 0)
            if (expectedRuleCount !== nativeLayerRule.cssRules.length) {
                return this.failHydration(`Layer \`${layerName}\` does not match the hydration manifest.`)
            }
        }

        for (const [layerName, nativeLayerRule] of nativeUtilityLayerRules) {
            if (!manifestLayerRules.has(layerName) && nativeLayerRule.cssRules.length) {
                return this.failHydration(`Layer \`${layerName}\` has no hydration manifest rules.`)
            }
        }

        if (!this.hydrateHydrationManifestVariables(nativeThemeLayer)) {
            return this.failHydration('Theme layer does not match the hydration manifest.')
        }
        if (!this.hydrateHydrationManifestAnimations(nativeKeyframesRules)) {
            return this.failHydration('Keyframes do not match the hydration manifest.')
        }

        for (const [layerName, nativeLayerRule] of nativeUtilityLayerRules) {
            const manifestRules = manifestLayerRules.get(layerName)
            if (!manifestRules?.length) continue
            const layer = this.getUtilityLayerByName(layerName)!
            this.hydrateHydrationManifestLayer(layer, nativeLayerRule, manifestRules, result)
        }

        if (process.env.NODE_ENV === 'development') {
            debugRuntimeHydrated(this, result)
        }
        return result
    }

    disconnect() {
        this.clearPendingRemovedClassNames()
        if (!this.observing) return
        if (this.observer) {
            this.observer.disconnect()
            this.observer = undefined
        }
        // @ts-ignore
        this.observing = false
        this.reset()
        this.loadManifest(this.manifest)
        this.classCounts.clear()
        this.classTracker.reset()
        if (!this.progressive) {
            this.style?.remove()
            this.style = null
        }
        if (process.env.NODE_ENV === 'development') {
            debugRuntimeDisconnected(this)
        }
        return this
    }

    refresh(manifest: MasterCSSManifest = this.manifest) {
        this.clearPendingRemovedClassNames()
        if (!this.observing || !this.style!.sheet) return this
        const cssRules = this.style!.sheet.cssRules
        for (let i = cssRules.length - 1; i >= 0; i--) {
            this.style!.sheet.deleteRule(i)
        }
        super.refresh(manifest)
        /**
         * Recreate rules from the current class names against the latest manifest.
         * 所以 refresh 過後 rules 可能會變多也可能會變少
         */
        this.classCounts.forEach((_, className) => {
            this.add(className)
        })
        if (process.env.NODE_ENV === 'development') {
            debugRuntimeRefreshed(this, manifest)
        }
        return this
    }

    destroy() {
        this.disconnect()
        this.unregister()
        if (process.env.NODE_ENV === 'development') {
            debugRuntimeDestroyed(this)
        }
        return this
    }
}

(function (CSSRuntime) {
    registerGlobal(CSSRuntime)
})(CSSRuntime)
