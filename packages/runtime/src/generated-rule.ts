import type RuntimeLayer from './layer'
import type { MasterCSSHydrationRule } from '@master/css-schema/hydration-manifest'

export class HydratedGeneratedRuleNode {
  native?: CSSRule

  constructor(
    public readonly text: string
  ) { }
}

export default class HydratedGeneratedRule {
  native?: CSSRule
  readonly name: string
  readonly key: string
  readonly layerName: MasterCSSHydrationRule['layer']
  readonly type: MasterCSSHydrationRule['type']
  readonly sortTier: MasterCSSHydrationRule['sortTier']
  readonly priority: MasterCSSHydrationRule['priority']
  readonly text: string
  readonly valid = true
  readonly fixedClass?: string
  readonly nodes?: HydratedGeneratedRuleNode[]
  readonly variableNames?: Set<string>
  readonly animationNames?: Set<string>
  readonly selectorText?: string

  constructor(
    public readonly ir: MasterCSSHydrationRule,
    public readonly layer: RuntimeLayer
  ) {
    this.name = ir.className
    this.key = ir.key
    this.layerName = ir.layer
    this.type = ir.type
    this.sortTier = ir.sortTier
    this.priority = ir.priority
    this.text = ir.text
    this.selectorText = ir.selectorText
    if (ir.nodes?.length) {
      this.nodes = ir.nodes.map((node) => new HydratedGeneratedRuleNode(node.text))
    }
    if (ir.variableNames?.length) this.variableNames = new Set(ir.variableNames)
    if (ir.animationNames?.length) {
      this.animationNames = new Set(ir.animationNames)
    }
  }
}
