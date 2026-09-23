import type { ReactNode } from 'react'
import InlineCode from '~/internal/components/InlineCode'
import Translate from '~/internal/components/Translate'
import { filterNamespaceKeys } from '~/site/utils/manifest-utilities'

export interface NamespaceUtilityGroup {
  label: string
  keys: string[]
  namespace?: string
  namespaces?: string[]
  description?: ReactNode
}

interface NamespaceUtilityTableProps {
  groups: NamespaceUtilityGroup[]
}

export default function NamespaceUtilityTable(props: NamespaceUtilityTableProps) {
  const groups = props.groups
    .map((group) => ({
      ...group,
      keys: filterNamespaceKeys(group)
    }))
    .filter((group) => group.keys.length)
  const hasDescriptions = groups.some((group) => group.description)

  return (
    <figure>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th><Translate>Group</Translate></th>
              <th className="min-w:12rem"><Translate>{hasDescriptions ? 'Utility keys and purpose' : 'Utility keys'}</Translate></th>
            </tr>
          </thead>
          <tbody>
            {
              groups.map((group) => (
                <tr key={group.label}>
                  <th className="white-space:nowrap"><Translate>{group.label}</Translate></th>
                  <td>
                    <div>{renderKeys(group.keys)}</div>
                    {group.description && <div className="mt:xs"><Translate>{group.description}</Translate></div>}
                  </td>
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
      <InlineCode className="white-space:nowrap">{key}</InlineCode>
      {index !== keys.length - 1 && ', '}
    </span>
  ))
}
