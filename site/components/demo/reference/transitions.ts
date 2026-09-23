import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'transition': ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay'],
  'transition-property': ['transition-property', 'transition-duration'],
  'transition-duration': ['transition-duration', 'transition-timing-function'],
  'transition-delay': ['transition-delay', 'transition-duration'],
  'transition-timing-function': ['transition-timing-function', 'transition-duration'],
}
const captions: Record<string, string> = {
  'transition': 'The native control changes an authored CSS endpoint. The transition comes from the displayed classes; reduced motion and print keep the update immediate.',
  'transition-property': 'Each control changes the same authored endpoints. Only properties in the selected list interpolate; unrelated changes remain immediate.',
  'transition-duration': 'The control, travel distance and easing stay explicit. Duration is the interpolation interval, independent of any start delay.',
  'transition-delay': 'The visible control changes the endpoint before the layer starts moving. Each changing child owns its duration and delay; they are not inherited.',
  'transition-timing-function': 'The native transition keeps its authored duration and endpoints. Compare how the curve distributes progress, or how steps advances at discrete boundaries.',
}

/** Native controls and complete authored states own each transition timeline. */
export function transitions(section: ReferenceDemoSection): DemoScene {
  return typeSpecimens(section, {
    appearance: 'plain', properties: properties[section.page], caption: captions[section.page],
  })
}
