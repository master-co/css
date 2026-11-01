import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import { DemoSwatch } from '~/site/components/demo'

export { metadata }

const roles = [
  { label: 'Canvas', value: 'bg-surface-canvas' },
  { label: 'Raised', value: 'bg-surface-raised' },
  { label: 'Inset', value: 'bg-surface-inset' },
  { label: 'Blue 60', value: 'bg-blue-60' },
] as const

export default function Page() {
  return <ComponentPage title="Swatch" description="A sheet that shows a color role’s actual paint with its name and value underneath." sections={[
    { id: 'roles', title: 'Roles and steps', children: <Demo padding="sm">
      <div className="grid-cols(2) gap-sm w-full grid-cols(4)@sm">{roles.map(role => <DemoSwatch key={role.value} label={role.label} value={role.value} className={role.value} />)}</div>
    </Demo> },
  ]} usage={{ href: '/design-system#foundations', label: 'the design system overview' }} Documentation={ComponentDocumentation} />
}
