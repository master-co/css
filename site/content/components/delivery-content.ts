/** The same mode card and its known interaction state travel through every rendering path. */
export const deliveryMarkup = [{ tag: 'article', className: 'p-lg r-xl shadow-sm' }] as const
export const deliveryLateClass = 'bg-amber-10'
export const deliveryRenderedClasses = deliveryMarkup.flatMap((line) => line.className.split(' '))
export const deliverySourceClasses = [...deliveryRenderedClasses, deliveryLateClass]
export const deliveryMoments = [{ id: 'template', label: 'Template' }, { id: 'css', label: 'CSS' }, { id: 'paint', label: 'First paint' }, { id: 'later', label: 'New class' }] as const

/** The current chapter explains the delivery difference beside the shared timeline. */
export const deliveryExplanations = {
  static: [
    'Scan complete class names in your source.',
    'Write the matching rules to app.css.',
    'Load the stylesheet before the page is painted.',
    'Reuse the rule already shipped in app.css.'
  ],
  progressive: [
    'Read the classes in the server-rendered HTML.',
    'Embed the first-load CSS in the page.',
    'Paint with the CSS that came with the HTML.',
    'Start the deferred engine for an uncovered class.'
  ],
  runtime: [
    'Read the page’s classes in the browser.',
    'Start the runtime and create a stylesheet.',
    'Generate and apply the rules in the browser.',
    'Insert the new rule into the browser stylesheet.'
  ]
} satisfies Record<DeliveryMode, readonly [string, string, string, string]>

/** Timeline units, shared by the drawings and the real, isolated CSS preview. */
export const deliveryAdded = 3.04
export const deliveryTiming = {
  static: { rules: 0.24, step: 0.12, reference: 1.12, sheet: 1.72, lateRule: 0.72, latePaint: deliveryAdded },
  progressive: { rules: 1.22, step: 0.12, reference: 1.06, sheet: 1.76, loading: 3.16, ready: 3.36, lateRule: 3.53, latePaint: 3.78 },
  runtime: { rules: 2.08, step: 0.12, reference: 2.02, sheet: 2.08, lateRule: 3.43, latePaint: 3.68 }
} as const
export type DeliveryMode = keyof typeof deliveryTiming
export const deliveryOn = (moment: number) => `clamp(0, (var(--home-delivery-t) - ${moment}) * var(--delivery-reveal-rate, 10), 1)`
export const deliveryBetween = (from: number, to: number) => `clamp(0, min(var(--home-delivery-t) - ${from}, ${to} - var(--home-delivery-t)) * var(--delivery-reveal-rate, 10), 1)`
export function deliveryRuleAt(mode: DeliveryMode, className: string) {
  const timing = deliveryTiming[mode]
  return className === deliveryLateClass ? timing.lateRule : timing.rules + deliveryRenderedClasses.indexOf(className) * timing.step
}
export interface DeliveryRule { className: string, text: string, selector: string }
