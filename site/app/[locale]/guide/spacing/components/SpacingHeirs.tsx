import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'

const groups: NamespaceUtilityGroup[] = [
    {
        label: 'Margin',
        namespace: 'spacing',
        keys: ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'my', 'mxs', 'mxe', 'mys', 'mye']
    },
    {
        label: 'Padding',
        namespace: 'spacing',
        keys: ['p', 'pt', 'pr', 'pb', 'pl', 'px', 'py', 'pxs', 'pxe', 'pys', 'pye']
    },
    {
        label: 'Gap and inset',
        namespace: 'spacing',
        keys: ['gap', 'gap-x', 'gap-y', 'inset', 'top', 'right', 'bottom', 'left', 'ix', 'iy', 'ixs', 'ixe', 'iys', 'iye']
    },
    {
        label: 'Scroll spacing',
        namespace: 'spacing',
        keys: ['scroll-m', 'scroll-mt', 'scroll-mr', 'scroll-mb', 'scroll-ml', 'scroll-mx', 'scroll-my', 'scroll-p', 'scroll-pt', 'scroll-pr', 'scroll-pb', 'scroll-pl', 'scroll-px', 'scroll-py']
    },
    {
        label: 'Other native spacing',
        namespace: 'spacing',
        keys: ['border-spacing', 'outline-offset', 'text-indent', 'text-underline-offset', 'word-spacing', 'translate', 'transform-origin', 'object-position', 'background-position']
    }
]

export default function SpacingHeirs() {
    return <NamespaceUtilityTable groups={groups} />
}
