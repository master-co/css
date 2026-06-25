import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'

const groups: NamespaceUtilityGroup[] = [
    {
        label: 'Shadow',
        namespace: 'shadow',
        keys: ['shadow', 'box-shadow'],
        description: 'Use shadow tokens for product elevation and the native property name when surrounding code is clearer that way.'
    }
]

export function ShadowNamespaceTable() {
    return <NamespaceUtilityTable groups={groups} />
}
