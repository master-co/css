/** The same plan and its known interaction state travel through every rendering mode. */
export const deliveryMarkup = [{ tag: 'article', className: 'p-lg r-xl shadow-sm' }] as const
export const deliveryLateClass = 'bg-amber-10'
export const deliveryRenderedClasses = deliveryMarkup.flatMap((line) => line.className.split(' '))
export const deliverySourceClasses = [...deliveryRenderedClasses, deliveryLateClass]
export const deliveryMoments = [{ id: 'template', label: 'Template' }, { id: 'css', label: 'CSS delivery' }, { id: 'paint', label: 'First paint' }, { id: 'later', label: 'New class' }] as const

/** Timeline units, shared by the drawings and the real, isolated CSS preview. */
export const deliveryAdded = 3.04
export const deliveryTiming = {
  static: { rules: 0.24, step: 0.12, reference: 1.12, sheet: 1.72, lateRule: 0.72, latePaint: deliveryAdded },
  progressive: { rules: 1.22, step: 0.12, reference: 1.06, sheet: 1.76, loading: 3.16, ready: 3.36, lateRule: 3.53, latePaint: 3.78 },
  runtime: { rules: 2.08, step: 0.12, reference: 2.02, sheet: 2.08, lateRule: 3.43, latePaint: 3.68 }
} as const
export type DeliveryMode = keyof typeof deliveryTiming
export const deliveryOn = (moment: number) => `clamp(0, (var(--home-delivery-t) - ${moment}) * 10, 1)`
export const deliveryBetween = (from: number, to: number) => `clamp(0, min(var(--home-delivery-t) - ${from}, ${to} - var(--home-delivery-t)) * 10, 1)`
export function deliveryRuleAt(mode: DeliveryMode, className: string) {
  const timing = deliveryTiming[mode]
  return className === deliveryLateClass ? timing.lateRule : timing.rules + deliveryRenderedClasses.indexOf(className) * timing.step
}
export interface DeliveryRule { className: string, text: string, selector: string }
