import DemoPalette from '~/site/components/demo/DemoPalette'
import { FoundationColorRoles, FoundationSurfaces, FoundationLines, FoundationTextRoles, FoundationHue, FoundationTextHue, FoundationElevation, FoundationElevationState } from '~/site/components/demo/FoundationPaint'

const examples = [
  ['Color roles', '/guide/colors#choose-a-color-token', FoundationColorRoles],
  ['Surface hierarchy', '/guide/colors#surfaces', FoundationSurfaces],
  ['Line roles', '/guide/colors#line-roles', FoundationLines],
  ['Text roles', '/guide/colors#text-roles', FoundationTextRoles],
  ['Base hue', '/guide/colors#base-hue-aliases', FoundationHue],
  ['Text hue', '/guide/colors#text-hue-aliases', FoundationTextHue],
  ['Quiet elevation', '/guide/elevation#pair-elevation-with-color-roles', FoundationElevation],
  ['Interactive elevation', '/guide/elevation#change-elevation-by-state', FoundationElevationState],
] as const

export default function PaintRecipes() {
  return <div>
    <DemoPalette families={['blue', 'violet']} />
    {examples.map(([title, href, Component], index) => <section key={title} data-paint-recipe={index}>
      <div className="demo-recipe-heading"><h3>{title}</h3><a href={href} className="demo-recipe-link">View guide ↗</a></div>
      <Component />
    </section>)}
  </div>
}
