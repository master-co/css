import type MasterCSS from './core'
import { Utility } from './utility'
import { getRuleSortTier } from './utils/compare-rule-priority'
import type {
  MasterCSSGeneratedRuleIR,
  MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'

function serializeRule(className: string, rule: Utility): MasterCSSGeneratedRuleIR {
  const nodes = rule.nodes?.map((node) => ({ text: node.text }))
  return {
    className,
    key: rule.key,
    layer: rule.layerName,
    type: rule.type,
    sortTier: getRuleSortTier(rule),
    priority: {
      ...(rule.priority.features?.length ? { features: rule.priority.features.map((feature) => [...feature] as [string, number, number]) } : {}),
      selector: rule.priority.selector
    },
    text: rule.text,
    ...(nodes?.length ? { nodes } : {}),
    selectorText: rule.selectorText,
    ...(rule.variableNames?.size ? { variableNames: [...rule.variableNames] } : {}),
    ...(rule.animationNames?.size ? { animationNames: [...rule.animationNames] } : {})
  }
}

export default function createHydrationManifest(css: MasterCSS): MasterCSSHydrationManifest {
  const classNameByRule = new WeakMap<Utility, string>()
  for (const [className, rules] of css.classUtilities) {
    for (const rule of rules) {
      classNameByRule.set(rule, className)
    }
  }

  const hydrationManifest: MasterCSSHydrationManifest = {
    version: 1,
    rules: []
  }

  for (const layer of css.getUtilityLayers()) {
    for (const rule of layer.rules) {
      if (!(rule instanceof Utility)) continue
      const className = classNameByRule.get(rule)
      if (!className) continue
      hydrationManifest.rules.push(serializeRule(className, rule))
    }
  }

  return hydrationManifest
}

export type {
  MasterCSSGeneratedRuleIR,
  MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
