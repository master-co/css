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
  return <div className="grid gap-2xl">
    {examples.map(([title, href, Component], index) => <section key={title} className="grid gap-sm" data-foundation-recipe={index} id={index === 7 ? 'use-shape-shortcuts' : undefined}>
      <div className="flex flex-wrap items-baseline justify-between gap-sm"><h3 className="m(0) font-md font-semibold fg-text-strong">{title}</h3><a href={href} className="font-sm fg-text-muted fg-text-strong:hover">View guide ↗</a></div>
      <Component />
    </section>)}
    <DemoPageViewport src="/examples/layout-system" title="Workspace layout" height={540} />
  </div>
}
