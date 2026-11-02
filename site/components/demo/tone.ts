/** Teaching tones: neutral context, blue subject, violet comparison, amber measured, green and red outcomes. Name each one with a legend or label. */
export type DemoTone = 'neutral' | 'blue' | 'violet' | 'amber' | 'green' | 'red'

export const tone = (value: DemoTone) => value === 'neutral' ? undefined : value
