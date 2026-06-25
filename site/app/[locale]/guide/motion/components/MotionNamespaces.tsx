import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'

const groups: NamespaceUtilityGroup[] = [
    {
        label: 'Animation recipes',
        namespace: 'animate',
        keys: ['animate'],
        description: 'Use full animation recipes from animate tokens.'
    },
    {
        label: 'Duration',
        namespace: 'duration',
        keys: ['animation', 'animation-duration', 'animation-delay', 'transition', 'transition-duration', 'transition-delay'],
        description: 'Share timing tokens across animations, transitions, and delays.'
    },
    {
        label: 'Easing',
        namespace: 'easing',
        keys: ['animation', 'animation-timing-function', 'transition', 'transition-timing-function'],
        description: 'Share curve tokens across animation and transition timing functions.'
    }
]

export function MotionNamespaceTable() {
    return <NamespaceUtilityTable groups={groups} />
}
