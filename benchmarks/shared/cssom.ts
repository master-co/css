// These helpers are also serialized into benchmark pages. Keep their only
// dependencies here or in native browser globals; no product runtime APIs.
export function countCSSOMRules(rules?: CSSRuleList): number {
  let total = 0
  for (const rule of rules || []) {
    const children = 'cssRules' in rule ? (rule as CSSGroupingRule).cssRules : undefined
    // A CSSStyleRule can own nested rules and still contributes its own rule.
    // Other grouping wrappers contribute their descendants, including keyframes.
    if ('selectorText' in rule || !children) total++
    if (children) total += countCSSOMRules(children)
  }
  return total
}

export function collectCSSOMSelectorTexts(rules?: CSSRuleList): string[] {
  const selectors: string[] = []
  for (const rule of rules || []) {
    if ('selectorText' in rule) selectors.push(String((rule as CSSStyleRule).selectorText))
    if ('cssRules' in rule) selectors.push(...collectCSSOMSelectorTexts((rule as CSSGroupingRule).cssRules))
  }
  return selectors
}

export function summarizeCSSOM(rules?: CSSRuleList) {
  const layerRuleCounts: Record<string, number> = Object.create(null)
  const layerSelectorTexts: Record<string, string[]> = Object.create(null)
  let layerRuleCount = 0
  for (const rule of rules || []) {
    if (!(rule instanceof CSSLayerBlockRule)) continue
    const name = rule.name || 'anonymous'
    layerRuleCounts[name] = (layerRuleCounts[name] || 0) + rule.cssRules.length
    const selectors = layerSelectorTexts[name] ||= []
    selectors.push(...collectCSSOMSelectorTexts(rule.cssRules))
    layerRuleCount += rule.cssRules.length
  }
  return { layerRuleCount, layerRuleCounts, layerSelectorTexts, totalRuleCount: countCSSOMRules(rules) }
}

export function renderCSSOMReader() {
  return `(() => {
    ${countCSSOMRules.toString()}
    ${collectCSSOMSelectorTexts.toString()}
    ${summarizeCSSOM.toString()}
    globalThis.__benchmarkCSSOM = { countRules: countCSSOMRules, summarize: summarizeCSSOM };
  })();`
}

declare global {
  var __benchmarkCSSOM: { countRules: typeof countCSSOMRules; summarize: typeof summarizeCSSOM }
}
