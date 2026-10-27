import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'transform': ['transform', 'transform-origin'],
  'transform-origin': ['transform-origin', 'transform'],
  'transform-box': ['transform-box'],
  'transform-style': ['transform-style', 'opacity'],
  'will-change': ['will-change', 'transform', 'opacity'],
}
const captions: Record<string, string> = {
  'transform': 'The authored guide keeps the original layout slot visible. Client bounds follow the transformed element’s getBoundingClientRect, not its unchanged layout dimensions.',
  'transform-origin': 'The reference dimensions, pivot and transform are authored together. Markers stay outside the transformed element; the guides reveal displacement while client bounds report transformed width and height.',
  'transform-box': 'The complete HTML or SVG preserves source geometry. Reference boxes control percentages and pivots; client bounds use getBoundingClientRect and do not include an SVG stroke’s full paint.',
  'transform-style': 'The parent, front layer and perspective form a real 3D context. Compare the child’s geometry: grouping effects can flatten it even when the computed keyword remains preserve-3d.',
  'will-change': 'The readout observes the actual hint. Native controls remain visible and operable; this specimen does not measure speed or prove compositing-layer promotion.',
}

/** Keep native control states, SVG coordinates and nested 3D contexts in authored HTML. */
export function transforms(section: ReferenceDemoSection): DemoScene {
  return typeSpecimens(section, {
    appearance: 'plain', properties: properties[section.page],
    measure: section.page !== 'transform-style', measureLabel: 'Client bounds',
    caption: captions[section.page],
  })
}
