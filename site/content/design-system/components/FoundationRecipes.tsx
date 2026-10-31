import '~/site/styles/demo-interactions.css'
import FoundationBreakpoint from '~/site/components/demo/FoundationBreakpoint'
import { FoundationAxes, FoundationContainerGrid, FoundationMedia, FoundationRadius, FoundationShapes, FoundationShrink, FoundationSizing } from '~/site/components/demo/FoundationExamples'
import { DemoPageViewport } from '~/site/components/demo/DemoBrowser'

const examples = [
  ['Viewport typography', '/guide/responsive-design#based-on-viewport-breakpoints', FoundationBreakpoint],
  ['Container grid', '/guide/responsive-design#based-on-container-sizes', FoundationContainerGrid],
  ['Container media object', '/guide/layout-system', FoundationMedia],
  ['Fluid wrapper and measured object', '/guide/layout-system#use-container-tokens', FoundationSizing],
  ['One axis or both', '/guide/layout-system#use-container-tokens', FoundationAxes],
  ['Shrinkable content', '/guide/layout-system#add-explicit-tracks-only-when-needed', FoundationShrink],
  ['Radius scale', '/guide/colors#raised-surfaces', FoundationRadius],
  ['Shape shortcuts', '/guide/colors#raised-surfaces', FoundationShapes],
] as const

export default function FoundationRecipes() {
  return <div>
    {examples.map(([title, href, Component], index) => <section key={title} data-foundation-recipe={index} id={index === 7 ? 'use-shape-shortcuts' : undefined}>
      <div className="demo-recipe-heading"><h3>{title}</h3><a href={href} className="demo-recipe-link">View guide ↗</a></div>
      <Component />
    </section>)}
    <DemoPageViewport src="/examples/layout-system" title="Workspace layout" height={540} />
    <DemoPageViewport src="/examples/responsive-gallery" title="Responsive asset gallery" />
  </div>
}
