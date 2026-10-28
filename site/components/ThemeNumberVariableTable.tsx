import '~/site/styles/documentation-values.css'
import { useId } from 'react'
import InlineCode from '~/site/docs-shell/components/InlineCode'
import Translate from '~/site/docs-shell/components/Translate'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'

interface ThemeNumberVariableTableProps {
  namespace: string
  keys?: string[]
  variablePrefix?: string
  descriptions?: Record<string, string>
  representation?: 'spacing'
  referenceUnits?: boolean
}

const formatRem = (value: number) => `${Number(value.toFixed(4))}rem`
const formatPx = (value: number) => `${Number(value.toFixed(4))}px`

export default function ThemeNumberVariableTable(props: ThemeNumberVariableTableProps) {
  const captionId = useId()
  const { namespace, variablePrefix = namespace, descriptions, representation, referenceUnits = true } = props
  const entries = getThemeNumericVariableEntries(namespace).filter(entry => !props.keys || props.keys.includes(entry.key))
  const hasDescriptions = descriptions && entries.some(({ key }) => descriptions[key])
  const hasSpacingRepresentation = representation === 'spacing'
  const referenceUnit = entries.every(({ unit }) => unit === 'rem') ? 'px' : 'rem'

  return (
    <figure>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Numeric tables scroll within the document column and need native keyboard access. */}
      <div className="doc-number-variable-table doc-table" data-representation={hasSpacingRepresentation ? 'spacing' : undefined} data-reference-units={referenceUnits} role="region" aria-labelledby={captionId} tabIndex={0}>
        <table>
          <caption id={captionId} className="sr-only"><Translate>{namespace === 'breakpoint' ? 'Viewport breakpoints' : 'Numeric theme variables'}</Translate></caption>
          <thead>
            <tr>
              <th scope="col"><Translate>{namespace === 'breakpoint' ? 'Query' : 'Token'}</Translate></th>
              <th scope="col"><Translate>{namespace === 'breakpoint' ? 'Minimum width' : 'Value'}</Translate></th>
              {referenceUnits && <th scope="col">{referenceUnit.toUpperCase()}</th>}
              {hasSpacingRepresentation && <th scope="col"><Translate>Representation</Translate></th>}
              {hasDescriptions && <th scope="col" className="min-width:12rem"><Translate>Description</Translate></th>}
            </tr>
          </thead>
          <tbody>
            {
              entries.map((entry) => (
                <tr key={entry.key}>
                  <th scope="row"><InlineCode>{namespace === 'breakpoint' ? `@${entry.key}` : `--${variablePrefix}-${entry.key}`}</InlineCode></th>
                  <td><InlineCode>{entry.value}</InlineCode></td>
                  {referenceUnits && <td>{referenceUnit === 'px' ? formatPx(entry.px) : formatRem(entry.rem)}</td>}
                  {hasSpacingRepresentation && <td>{renderSpacingRepresentation(entry.value)}</td>}
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

function renderSpacingRepresentation(value: string) {
  return (
    <div aria-hidden="true" className="display:inline-flex width:fit-content outline-line-subtle outline-offset:-1px outline-style:solid outline-width:1px background:var(--stripe-pink) vertical-align:middle" style={{ gap: value }}>
      <div className="display:inline-block height:1.5em width:1.5em bg-surface-raised"></div>
      <div className="display:inline-block height:1.5em width:1.5em bg-surface-raised"></div>
    </div>
  )
}
