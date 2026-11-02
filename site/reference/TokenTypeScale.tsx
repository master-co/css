import type { CSSProperties } from 'react'
import DocumentDisclosure from '../components/DocumentDisclosure'
import { foundationTokens, tokenSpecimenProperties } from '../common/foundation-data/tokens'
import type { SheetGroup } from './sheets'

function resolved(value: string) {
  const name = value.match(/^var\(--([\w-]+)\)$/)?.[1]
  return (name && foundationTokens.find(token => token.name === name)?.values[0].value) || value
}

/** Full-sized specimens use the exact lookup values, including text's companions. */
export default function TokenTypeScale({ group }: { group: SheetGroup }) {
  if (!['font-family', 'font-size', 'font-weight', 'text', 'leading', 'tracking'].includes(group.namespace)) return null
  const title = `Compare all ${{ 'font-family': 'font families', 'font-size': 'font sizes', 'font-weight': 'font weights', text: 'text treatments', leading: 'line heights', tracking: 'tracking values' }[group.namespace]}`
  const compact = group.namespace === 'font-size' || group.namespace === 'text'
  return <DocumentDisclosure title={title}>
    <div className="ui-tray">
      {/* Real-size specimens can exceed the viewport; native scrolling must also work with a keyboard. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="ref-type-scale ui-stage" data-kind={group.namespace} role="region" aria-label={title} tabIndex={0}>
        {group.values.map(value => {
          const style: CSSProperties = group.namespace === 'text'
            ? { fontSize: resolved(value.cells![0]), lineHeight: value.cells![1], letterSpacing: value.cells![2] }
            : { [tokenSpecimenProperties[group.namespace]]: resolved(value.value) }
          return <div className="ref-type-specimen" key={value.id}>
            <code>{value.className}</code>
            <div className="ref-type-sample" style={style}>
              {group.namespace === 'leading' ? <><span>Read this line</span><span>Then the next</span><span>And one more</span></> : compact ? 'Aa' : 'The shape of a letter'}
            </div>
          </div>
        })}
      </div>
    </div>
  </DocumentDisclosure>
}
