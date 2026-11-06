/** The same mode card travels through every rendering path; its classes are all in the markup. */
export const deliveryMarkup = [{ tag: 'article', className: 'p-lg r-xl bg-surface-raised shadow-sm' }] as const
export const deliveryRenderedClasses = deliveryMarkup.flatMap((line) => line.className.split(' '))
export const deliveryMoments = [{ id: 'template', label: 'Template' }, { id: 'css', label: 'CSS' }, { id: 'paint', label: 'First paint' }] as const
/** The timeline runs one unit per moment and ends with the first paint. */
export const deliveryEnd = deliveryMoments.length

/** The current chapter explains the delivery difference beside the shared timeline. */
export const deliveryExplanations = {
  static: [
    'Scan complete class names in your source.',
    'Write the matching rules to app.css.',
    'Load the stylesheet before the page is painted.'
  ],
  prerender: [
    'Read the classes in the rendered page HTML.',
    'Embed the matching rules in the page.',
    'Paint with the CSS that came with the HTML.'
  ],
  runtime: [
    'Read the page’s classes in the browser.',
    'Start the runtime and create a stylesheet.',
    'Generate and apply the rules in the browser.'
  ]
} satisfies Record<DeliveryMode, readonly [string, string, string]>

/**
 * Timeline units, shared by the drawings and the real, isolated CSS preview. No rule reaches the
 * preview before the First paint moment (2–3): delivered stylesheets arrive there whole at `sheet`,
 * runtime rules one by one, and `paint` is when the preview shows every rule.
 */
export const deliveryTiming = {
  static: { rules: 0.24, step: 0.12, reference: 1.12, sheet: 2.45, paint: 2.45 },
  prerender: { rules: 1.22, step: 0.12, reference: 1.06, sheet: 2.45, paint: 2.45 },
  runtime: { rules: 2.08, step: 0.12, reference: 2.02, sheet: 2.08, paint: 2.56 }
} as const
export type DeliveryMode = keyof typeof deliveryTiming
export const deliveryOn = (moment: number) => `clamp(0, (var(--home-delivery-t) - ${moment}) * var(--delivery-reveal-rate, 10), 1)`
export const deliveryBetween = (from: number, to: number) => `clamp(0, min(var(--home-delivery-t) - ${from}, ${to} - var(--home-delivery-t)) * var(--delivery-reveal-rate, 10), 1)`
export function deliveryRuleAt(mode: DeliveryMode, className: string) {
  const timing = deliveryTiming[mode]
  return timing.rules + deliveryRenderedClasses.indexOf(className) * timing.step
}
export interface DeliveryRule { className: string, text: string, selector: string }
