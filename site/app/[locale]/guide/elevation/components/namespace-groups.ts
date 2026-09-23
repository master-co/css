import type { NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'

export const groups: NamespaceUtilityGroup[] = [
  {
    label: 'Shadow',
    namespace: 'shadow',
    keys: ['shadow', 'box-shadow'],
    description: 'Use shadow tokens for product elevation and the native property name when surrounding code is clearer that way.'
  }
]
