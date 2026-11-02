import DocumentDisclosure from '../components/DocumentDisclosure'
import type { SheetGroup } from './sheets'

/** Complete visual lookup from the same values as the adjacent table. */
export default function TokenSurfaceScale({ group }: { group: SheetGroup }) {
  if (group.namespace !== 'radius' && group.namespace !== 'shadow') return null
  const radius = group.namespace === 'radius'
  return <DocumentDisclosure title={`Compare all ${radius ? 'radius' : 'shadow'} values`}>
    <div className="ui-tray">
      <div className="ref-surface-scale ui-stage" data-kind={group.namespace}>
        {group.values.map(value => <div className="ref-surface-specimen" key={value.id}>
          <code>{value.className}</code>
          <div className="ref-surface-sample" aria-hidden="true" style={radius ? { borderRadius: value.value } : { boxShadow: value.value }} />
        </div>)}
      </div>
    </div>
  </DocumentDisclosure>
}
