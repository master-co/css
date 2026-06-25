import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'

const groups: NamespaceUtilityGroup[] = [
    {
        label: 'Text scale',
        namespace: 'font-size',
        keys: ['text', 'font', 'font-size'],
        description: 'Use the text utility for complete type treatments and font utilities for font-size-only changes.'
    },
    {
        label: 'Font family',
        namespace: 'font-family',
        keys: ['font', 'font-family'],
        description: 'Use family tokens for reusable typeface choices.'
    },
    {
        label: 'Font weight',
        namespace: 'font-weight',
        keys: ['font', 'font-weight'],
        description: 'Use weight tokens for emphasis and hierarchy.'
    },
    {
        label: 'Line height',
        namespace: 'leading',
        keys: ['leading', 'line-height'],
        description: 'Use leading tokens for readable vertical rhythm.'
    },
    {
        label: 'Letter spacing',
        namespace: 'tracking',
        keys: ['tracking', 'letter-spacing'],
        description: 'Use tracking tokens for repeated letter-spacing decisions.'
    }
]

export function TypographyNamespaceTable() {
    return <NamespaceUtilityTable groups={groups} />
}
