import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'

const groups: NamespaceUtilityGroup[] = [
  {
    label: 'All corners',
    namespace: 'radius',
    keys: ['r', 'border-radius'],
    description: 'Apply the same radius token to the whole shape.'
  },
  {
    label: 'Physical corners',
    namespace: 'radius',
    keys: ['rtl', 'rtr', 'rbr', 'rbl', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
    description: 'Target visual corners when the design is physical rather than writing-mode aware.'
  },
  {
    label: 'Logical corners',
    namespace: 'radius',
    keys: ['border-start-start-radius', 'border-start-end-radius', 'border-end-start-radius', 'border-end-end-radius'],
    description: 'Target flow-relative corners for directional layouts.'
  }
]

export function RadiusNamespaceTable() {
  return <NamespaceUtilityTable groups={groups} />
}
