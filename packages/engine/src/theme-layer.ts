import MasterCSS from './core'
import Layer from './layer'
import VariableRule, { VariableRuleNode } from './variable-rule'

export interface VariableRuleBucket {
    mediaText: string
    selectorText: string
    order: number
    nodes: VariableRuleNode[]
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
        const text = `${bucket.selectorText}{${bucket.nodes.map(({ declarationText }) => declarationText).join(';')}}`
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
