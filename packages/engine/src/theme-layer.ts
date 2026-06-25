import MasterCSS from './core'
import Layer from './layer'
import VariableRule, { VariableRuleNode } from './variable-rule'

export interface ThemeLayerDeclaration {
    name: string
    value: string
}

export interface VariableRuleBucket {
    mediaText: string
    mode?: string
    selectorText: string
    order: number
    nodes: VariableRuleNode[]
}

function normalizeSelectorText(selectorText: string) {
    return selectorText.replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim()
}

export default class ThemeLayer extends Layer {
    readonly rules: VariableRule[] = []

    constructor(
        public name: string,
        public css: MasterCSS
    ) {
        super(name, css)
    }

    protected getBucketRank(bucket: Pick<VariableRuleBucket, 'mediaText' | 'selectorText'>) {
        if (bucket.mediaText) return 2
        const selectors = bucket.selectorText.split(',').map((selector) => selector.trim())
        return selectors.includes(':root') || selectors.includes(':host') ? 0 : 1
    }

    getModeSelectorText(mode: string, isDefaultMode = false) {
        switch (this.css.settings.modeTrigger) {
            case 'host':
                return `:host(.${mode})${isDefaultMode ? ',:host' : ''}`
            case 'class':
                return `.${mode}${isDefaultMode ? ',:root' : ''}`
            default:
                return ':root'
        }
    }

    protected matchesModeSelectorText(mode: string, selectorText: string) {
        const normalizedSelectorText = normalizeSelectorText(selectorText)
        const expectedSelectorTexts = [this.getModeSelectorText(mode)]
        const isDefaultMode = this.css.settings.defaultMode !== 'none' && this.css.settings.defaultMode === mode
        if (isDefaultMode) {
            expectedSelectorTexts.push(this.getModeSelectorText(mode, true))
        }
        return expectedSelectorTexts
            .map((expectedSelectorText) => normalizeSelectorText(expectedSelectorText))
            .includes(normalizedSelectorText)
    }

    getBucketColorScheme(bucket: Pick<VariableRuleBucket, 'mediaText' | 'mode' | 'selectorText'>) {
        if (this.css.settings.modeTrigger !== 'class' && this.css.settings.modeTrigger !== 'host') return
        if (bucket.mediaText) return
        if (bucket.mode !== 'light' && bucket.mode !== 'dark') return
        if (!this.matchesModeSelectorText(bucket.mode, bucket.selectorText)) return
        return bucket.mode
    }

    getBucketSyntheticDeclarations(bucket: Pick<VariableRuleBucket, 'mediaText' | 'mode' | 'selectorText'>): ThemeLayerDeclaration[] {
        const colorScheme = this.getBucketColorScheme(bucket)
        return colorScheme
            ? [{ name: 'color-scheme', value: colorScheme }]
            : []
    }

    protected compareBuckets(a: VariableRuleBucket, b: VariableRuleBucket) {
        return this.getBucketRank(a) - this.getBucketRank(b) || a.order - b.order
    }

    protected shouldInsertBucketBefore(
        bucket: Pick<VariableRuleBucket, 'mediaText' | 'selectorText'>,
        existingBucket: Pick<VariableRuleBucket, 'mediaText' | 'selectorText'>
    ) {
        return this.getBucketRank(bucket) < this.getBucketRank(existingBucket)
    }

    getBuckets() {
        const buckets = new Map<string, VariableRuleBucket>()
        for (const rule of this.rules) {
            for (const node of rule.nodes) {
                const key = node.mediaText + '\n' + node.selectorText
                let bucket = buckets.get(key)
                if (!bucket) {
                    bucket = {
                        mediaText: node.mediaText,
                        mode: node.mode,
                        selectorText: node.selectorText,
                        order: buckets.size,
                        nodes: []
                    }
                    buckets.set(key, bucket)
                }
                bucket.nodes.push(node)
            }
        }
        return Array.from(buckets.values()).sort((a, b) => this.compareBuckets(a, b))
    }

    getBucketText(bucket: VariableRuleBucket) {
        const declarations = [
            ...this.getBucketSyntheticDeclarations(bucket).map(({ name, value }) => `${name}:${value}`),
            ...bucket.nodes.map(({ declarationText }) => declarationText)
        ]
        const text = `${bucket.selectorText}{${declarations.join(';')}}`
        return bucket.mediaText
            ? `${bucket.mediaText}{${text}}`
            : text
    }

    get text(): string {
        const ruleText = this.getBuckets().map((bucket) => this.getBucketText(bucket)).join('')
        if (!ruleText) return ''
        return '@layer ' + this.name + '{' + ruleText + '}'
    }
}
