import '~/site/styles/documentation-values.css'
import { useId } from 'react'
import InlineCode from '~/site/docs-shell/components/InlineCode'
import Translate from '~/site/docs-shell/components/Translate'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'

interface ThemeNumberVariableTableProps {
  namespace: string
  variablePrefix?: string
  descriptions?: Record<string, string>
  representation?: 'spacing'
}

const formatRem = (value: number) => `${Number(value.toFixed(4))}rem`
const formatPx = (value: number) => `${Number(value.toFixed(4))}px`

export default function ThemeNumberVariableTable(props: ThemeNumberVariableTableProps) {
  const captionId = useId()
  const { namespace, variablePrefix = namespace, descriptions, representation } = props
  const entries = getThemeNumericVariableEntries(namespace)
  const hasDescriptions = descriptions && entries.some(({ key }) => descriptions[key])
  const hasSpacingRepresentation = representation === 'spacing'
  const referenceUnit = entries.every(({ unit }) => unit === 'rem') ? 'px' : 'rem'

  return (
    <figure>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Numeric tables scroll within the document column and need native keyboard access. */}
      <div className="doc-table doc-number-variable-table" data-representation={hasSpacingRepresentation ? 'spacing' : undefined} role="region" aria-labelledby={captionId} tabIndex={0}>
        <table>
          <caption id={captionId} className="sr-only"><Translate>Numeric theme variables</Translate></caption>
          <thead>
            <tr>
              <th scope="col"><Translate>Token</Translate></th>
              <th scope="col"><Translate>Value</Translate></th>
              <th scope="col">{referenceUnit.toUpperCase()}</th>
              {hasSpacingRepresentation && <th scope="col"><Translate>Representation</Translate></th>}
              {hasDescriptions && <th scope="col" className="min-w:12rem"><Translate>Description</Translate></th>}
            </tr>
          </thead>
          <tbody>
            {
              entries.map((entry, index) => (
                <tr key={entry.key}>
                  <th scope="row"><InlineCode>{`--${variablePrefix}-${entry.key}`}</InlineCode></th>
                  <td><InlineCode>{entry.value}</InlineCode></td>
                  <td>{referenceUnit === 'px' ? formatPx(entry.px) : formatRem(entry.rem)}</td>
                  {hasSpacingRepresentation && <td>{renderSpacingRepresentation(entry.value, index, entries.length)}</td>}
                  {hasDescriptions && <td><Translate>{descriptions?.[entry.key]}</Translate></td>}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </figure>
  )
}

function renderSpacingRepresentation(value: string, index: number, count: number) {
  return (
    <div aria-hidden="true" className="inline-flex w:fit-content outline:1px|solid|var(--color-line-muted) outline-offset:-1px background-color:var(--stripe-pink) v:middle" style={{ gap: value }}>
      {Array.from({ length: count + 2 - index }, (_, index) => <div key={index} className="inline-block size:1.5em surface-raised"></div>)}
    </div>
  )
}
