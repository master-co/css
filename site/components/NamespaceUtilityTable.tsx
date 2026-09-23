import { useId, type ReactNode } from 'react'
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
  const captionId = useId()
  const groups = props.groups
    .map((group) => ({
      ...group,
      keys: filterNamespaceKeys(group)
    }))
    .filter((group) => group.keys.length)
  const hasDescriptions = groups.some((group) => group.description)

  return (
    <figure>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The table's narrow overflow region must be focusable for native keyboard scrolling. */}
      <div className="doc-table doc-utility-table" data-has-descriptions={hasDescriptions || undefined} role="region" aria-labelledby={captionId} tabIndex={0}>
        <table>
          <caption id={captionId} className="sr-only"><Translate>Utility groups table</Translate></caption>
          <thead>
            <tr>
              <th scope="col"><Translate>Group</Translate></th>
              <th scope="col"><Translate>Utility keys</Translate></th>
              {hasDescriptions && <th scope="col"><Translate>Description</Translate></th>}
            </tr>
          </thead>
          <tbody>
            {
              groups.map((group) => (
                <tr key={group.label}>
                  <th scope="row"><Translate>{group.label}</Translate></th>
                  <td>{renderKeys(group.keys)}</td>
                  {hasDescriptions && <td><Translate>{group.description}</Translate></td>}
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
