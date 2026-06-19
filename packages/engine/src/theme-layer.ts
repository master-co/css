import MasterCSS from './core'
import Layer from './layer'
import VariableRule, { VariableRuleNode } from './variable-rule'

export interface VariableRuleBucket {
    mediaText: string
    selectorText: string
    order: number
    nodes: VariableRuleNode[]
}

function getBucketRank(bucket: Pick<VariableRuleBucket, 'mediaText' | 'selectorText'>) {
    if (bucket.mediaText) return 2
    const selectors = bucket.selectorText.split(',').map((selector) => selector.trim())
    return selectors.includes(':root') || selectors.includes(':host') ? 0 : 1
}

function compareBuckets(a: VariableRuleBucket, b: VariableRuleBucket) {
    return getBucketRank(a) - getBucketRank(b) || a.order - b.order
}

export function getVariableRuleBuckets(rules: readonly VariableRule[]) {
    const buckets = new Map<string, VariableRuleBucket>()
    for (const rule of rules) {
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
    return Array.from(buckets.values()).sort(compareBuckets)
}

export function getVariableRuleBucketText(bucket: VariableRuleBucket) {
    const text = `${bucket.selectorText}{${bucket.nodes.map(({ declarationText }) => declarationText).join(';')}}`
    return bucket.mediaText
        ? `${bucket.mediaText}{${text}}`
        : text
}

export function getThemeLayerText(name: string, rules: readonly VariableRule[]) {
    const ruleText = getVariableRuleBuckets(rules).map((bucket) => getVariableRuleBucketText(bucket)).join('')
    if (!ruleText) return ''
    return '@layer ' + name + '{' + ruleText + '}'
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
        return getBucketRank(bucket)
    }

    protected compareBuckets(a: VariableRuleBucket, b: VariableRuleBucket) {
        return compareBuckets(a, b)
    }

    protected shouldInsertBucketBefore(
        bucket: Pick<VariableRuleBucket, 'mediaText' | 'selectorText'>,
        existingBucket: Pick<VariableRuleBucket, 'mediaText' | 'selectorText'>
    ) {
        return this.getBucketRank(bucket) < this.getBucketRank(existingBucket)
    }

    getBuckets() {
        return getVariableRuleBuckets(this.rules)
    }

    getBucketText(bucket: VariableRuleBucket) {
        return getVariableRuleBucketText(bucket)
    }

    get text(): string {
        return getThemeLayerText(this.name, this.rules)
    }
}
