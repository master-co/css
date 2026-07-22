import type RuntimeLayer from './layer'
import type { MasterCSSGeneratedRuleIR } from '@master/css-schema/hydration-manifest'

function collectVariableNames(text: string) {
  const variableNames = new Set<string>()
  for (const match of text.matchAll(/var\(\s*--([_a-zA-Z0-9-]+)/g)) {
    variableNames.add(match[1])
  }
  return variableNames
}

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
  readonly layerName: MasterCSSGeneratedRuleIR['layer']
  readonly type: MasterCSSGeneratedRuleIR['type']
  readonly sortTier: MasterCSSGeneratedRuleIR['sortTier']
  readonly priority: MasterCSSGeneratedRuleIR['priority']
  readonly text: string
  readonly valid = true
  readonly fixedClass?: string
  readonly nodes?: HydratedGeneratedRuleNode[]
  readonly variableNames?: Set<string>
  readonly animationNames?: Set<string>
  readonly selectorText?: string

  constructor(
    public readonly ir: MasterCSSGeneratedRuleIR,
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
    const variableNames = collectVariableNames(ir.text)
    ir.nodes?.forEach((node) => {
      collectVariableNames(node.text).forEach((variableName) => variableNames.add(variableName))
    })
    ir.variableNames?.forEach((variableName) => variableNames.add(variableName))
    if (variableNames.size) {
      this.variableNames = variableNames
    }
    if (ir.animationNames?.length) {
      this.animationNames = new Set(ir.animationNames)
    }
  }
}
