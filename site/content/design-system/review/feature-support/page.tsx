import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import DemoFeatureSupport from '~/site/components/demo/DemoFeatureSupport'
import DemoViewTransition from '~/site/components/demo/DemoViewTransition'

export { metadata }

export default function Page() {
  return <ComponentPage title="Platform behavior" description="Report what this browser supports without changing the example’s own fallback, and run view transitions in an isolated document." sections={[
    { id: 'support', title: 'Feature support', children: <Demo padding="sm" caption="The report uses CSS.supports() after hydration; the example keeps its native fallback.">
      <div className="grid gap-sm py-md">
        <DemoFeatureSupport condition="(field-sizing: content)" />
        <DemoFeatureSupport condition="(not-a-css-property: value)" />
      </div>
    </Demo> },
    { id: 'view-transition', title: 'View transitions', children: <DemoViewTransition /> },
  ]} usage={{ href: '/guide/view-transitions', label: 'the View transitions guide' }} Documentation={ComponentDocumentation} />
}
