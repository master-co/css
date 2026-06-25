import InlineCode from '~/internal/components/InlineCode'
import { getNativeValueNamespacePublicKeys } from '~/site/utils/manifest-utilities'

const spacingKeys = new Set(getNativeValueNamespacePublicKeys('spacing'))
const groups = [
    {
        label: 'Margin',
        keys: ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'my', 'mxs', 'mxe', 'mys', 'mye']
    },
    {
        label: 'Padding',
        keys: ['p', 'pt', 'pr', 'pb', 'pl', 'px', 'py', 'pxs', 'pxe', 'pys', 'pye']
    },
    {
        label: 'Gap and inset',
        keys: ['gap', 'gap-x', 'gap-y', 'inset', 'top', 'right', 'bottom', 'left', 'ix', 'iy', 'ixs', 'ixe', 'iys', 'iye']
    },
    {
        label: 'Scroll spacing',
        keys: ['scroll-m', 'scroll-mt', 'scroll-mr', 'scroll-mb', 'scroll-ml', 'scroll-mx', 'scroll-my', 'scroll-p', 'scroll-pt', 'scroll-pr', 'scroll-pb', 'scroll-pl', 'scroll-px', 'scroll-py']
    },
    {
        label: 'Other native spacing',
        keys: ['border-spacing', 'outline-offset', 'text-indent', 'text-underline-offset', 'word-spacing', 'translate', 'transform-origin', 'object-position', 'background-position']
    }
].map((group) => ({
    ...group,
    keys: group.keys.filter((key) => spacingKeys.has(key))
}))

export default function SpacingHeirs() {
    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Group</th>
                            <th>Utility keys</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            groups.map((group) => (
                                <tr key={group.label}>
                                    <th className="white-space:nowrap">{group.label}</th>
                                    <td>{renderKeys(group.keys)}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}

function renderKeys(keys: string[]) {
    return keys.map((key, index) => (
        <span key={key}>
            <InlineCode>{key}</InlineCode>
            {index !== keys.length - 1 && ', '}
        </span>
    ))
}
