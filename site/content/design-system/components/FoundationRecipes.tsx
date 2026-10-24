import '~/site/styles/demo-interactions.css'
import FoundationBreakpoint from '~/site/components/demo/FoundationBreakpoint'
import { FoundationAxes, FoundationContainerGrid, FoundationMedia, FoundationRadius, FoundationShapes, FoundationShrink, FoundationSizing } from '~/site/components/demo/FoundationExamples'
import { DemoPageViewport } from '~/site/components/demo/DemoBrowser'

const examples = [
  ['Viewport typography', '/guide/breakpoints#use-breakpoint-variants', FoundationBreakpoint],
  ['Container grid', '/guide/containers#create-a-query-container', FoundationContainerGrid],
  ['Container media object', '/guide/layout-system#choose-css-grid-or-flexbox', FoundationMedia],
  ['Fluid wrapper and measured object', '/guide/sizing', FoundationSizing],
  ['One axis or both', '/guide/sizing#pair-axes-deliberately', FoundationAxes],
  ['Shrinkable content', '/guide/sizing#constrain-instead-of-forcing', FoundationShrink],
  ['Radius scale', '/guide/corner-radius', FoundationRadius],
  ['Shape shortcuts', '/guide/corner-radius#use-shape-shortcuts', FoundationShapes],
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
