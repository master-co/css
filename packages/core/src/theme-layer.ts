import MasterCSS from './core'
import Layer from './layer'
import VariableRule, { VariableRuleNode } from './variable-rule'

export interface VariableRuleBucket {
    mediaText: string
    selectorText: string
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
                        nodes: []
                    }
                    buckets.set(key, bucket)
                }
                bucket.nodes.push(node)
            }
        }
        return Array.from(buckets.values())
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
