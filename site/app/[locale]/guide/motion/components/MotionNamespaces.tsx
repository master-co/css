import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'

const groups: NamespaceUtilityGroup[] = [
  {
    label: 'Animation recipes',
    namespace: 'animate',
    keys: ['animate'],
    description: 'Use named animation recipes with explicit companion tokens.'
  },
  {
    label: 'Duration',
    namespace: 'duration',
    keys: ['animation-duration', 'animation-delay', 'transition-duration', 'transition-delay'],
    description: 'Share timing tokens across animations, transitions, and delays.'
  },
  {
    label: 'Easing',
    namespace: 'easing',
    keys: ['animation-timing-function', 'transition-timing-function'],
    description: 'Share curve tokens across animation and transition timing functions.'
  }
]

export function MotionNamespaceTable() {
  return <NamespaceUtilityTable groups={groups} />
}
