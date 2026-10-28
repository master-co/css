import { createRenderSessionSync } from '@master/css/node'
import preset from '~/site/utils/preset-manifest'
import { deliverySourceClasses, type DeliveryRule } from './delivery-content'

let cache: { globals: string, rules: DeliveryRule[] } | undefined
/** Keep both the code inspector and isolated preview on the public Rust engine's actual output. */
export function getDeliveryProgram() {
  if (cache) return cache
  const engine = createRenderSessionSync({ manifest: preset })
  try {
    const { classRules, cssText } = engine.ensureClassRules(deliverySourceClasses)
    const rules = deliverySourceClasses.map(className => {
      const [rule] = classRules[className]
      if (!rule.selectorText) throw new Error(`The delivery sample requires a style rule for ${className}`)
      return { className, text: rule.text, selector: rule.selectorText }
    }).sort((a, b) => cssText.indexOf(a.text) - cssText.indexOf(b.text))
    // These exact, single-property rule fragments get their own controllable style elements.
    // Everything else, including the engine's :host token declarations, stays untouched.
    const globals = rules.reduce((text, rule) => text.replace(rule.text, ''), cssText)
    return cache = { globals, rules }
  } finally {
    engine.dispose()
  }
}
