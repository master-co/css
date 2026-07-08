import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'

const groups: NamespaceUtilityGroup[] = [
  {
    label: 'General paint',
    namespace: 'color',
    keys: ['bg', 'background-color', 'fg', 'color', 'accent-color', 'fill', 'filter'],
    description: 'Use palette steps and base hue aliases for broad paint decisions.'
  },
  {
    label: 'Surfaces',
    namespace: 'color-surface',
    keys: ['surface'],
    description: 'Use surface roles for panels, cards, overlays, and inverse blocks.'
  },
  {
    label: 'Line roles',
    namespace: 'color-line',
    keys: ['b', 'bt', 'br', 'bb', 'bl', 'bx', 'by', 'border', 'border-color', 'outline', 'outline-color', 'stroke'],
    description: 'Use line roles for borders, dividers, outlines, and strokes before falling back to palette colors.'
  },
  {
    label: 'Text roles',
    namespace: 'color-text',
    keys: ['text', 'fg', 'color', 'caret-color', 'text-fill-color', '-webkit-text-fill-color', 'text-decoration', 'text-decoration-color'],
    description: 'Use text roles for readable foreground hierarchy and interaction states.'
  },
  {
    label: 'Effects and strokes',
    namespace: 'color',
    keys: ['shadow', 'box-shadow', 'text-shadow', 'text-stroke', 'text-stroke-color', 'backdrop-filter'],
    description: 'Use color tokens where paint appears inside effects or stroke utilities.'
  }
]

export function ColorNamespaceTable() {
  return <NamespaceUtilityTable groups={groups} />
}
