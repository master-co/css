import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import DemoCatalog from '~/site/components/demo/DemoCatalog'
import DemoExample from '~/site/components/demo/DemoExample'

export { metadata }

export default function Page() {
  return <ComponentPage kicker="Documents" title="Recipe catalog" description="Groups of closed recipes; each opens to a complete example." sections={[
    { id: 'catalog', title: 'A recipe group', children: <DemoCatalog groups={[{
      id: 'current-catalog-flow', title: 'Document flow', entries: [
        { id: 'current-catalog-clear', title: 'Clear a right float', label: '(clear:right)', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/clear', children: <DemoExample page="clear" section="clearing-right-floats" /> },
        { id: 'current-catalog-clear-both', title: 'Clear both sides', label: '(clear:both)', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/clear', children: <DemoExample page="clear" section="clearing-both-left-and-right-floats" /> }
      ]
    }]} /> },
  ]} usage={{ href: '/design-system/authoring#working-recipes', label: 'the authoring handbook' }} Documentation={ComponentDocumentation} />
}
