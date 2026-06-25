import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'

const groups: NamespaceUtilityGroup[] = [
    {
        label: 'Preferred size',
        namespace: 'container',
        keys: ['w', 'h', 'width', 'height', 'inline-size', 'block-size', 'size', 'size-x', 'size-y'],
        description: 'Set one axis or both axes from the shared container scale.'
    },
    {
        label: 'Minimum constraints',
        namespace: 'container',
        keys: ['min', 'min-w', 'min-h', 'min-size', 'min-size-x', 'min-size-y', 'min-width', 'min-height', 'min-inline-size', 'min-block-size'],
        description: 'Keep regions from collapsing below a reusable layout threshold.'
    },
    {
        label: 'Maximum constraints',
        namespace: 'container',
        keys: ['max', 'max-w', 'max-h', 'max-size', 'max-size-x', 'max-size-y', 'max-width', 'max-height', 'max-inline-size', 'max-block-size'],
        description: 'Cap wrappers, panels, media, and content regions.'
    },
    {
        label: 'Layout basis',
        namespace: 'container',
        keys: ['flex-basis'],
        description: 'Give flex items a shared starting size before free space is distributed.'
    },
    {
        label: 'Intrinsic and media sizes',
        namespace: 'container',
        keys: ['background-size', 'mask-size', 'contain-intrinsic-inline-size', 'contain-intrinsic-block-size'],
        description: 'Use container tokens for reusable media and intrinsic size decisions.'
    }
]

export function ContainerNamespaceTable() {
    return <NamespaceUtilityTable groups={groups} />
}
