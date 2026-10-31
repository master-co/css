import '~/site/styles/demo-interactions.css'
import DemoPalette from '~/site/components/demo/DemoPalette'
import { FoundationColorRoles, FoundationSurfaces, FoundationLines, FoundationTextRoles, FoundationHue, FoundationTextHue, FoundationElevation, FoundationElevationState } from '~/site/components/demo/FoundationPaint'

const examples = [
  ['Color roles', '/guide/colors#choose-a-color-token', FoundationColorRoles],
  ['Surface hierarchy', '/reference/tokens/color-roles#color-surface', FoundationSurfaces],
  ['Line roles', '/reference/tokens/color-roles#color-line', FoundationLines],
  ['Text roles', '/reference/tokens/color-roles#color-text', FoundationTextRoles],
  ['Base hue', '/guide/colors#mode-aware-hue-aliases', FoundationHue],
  ['Text hue', '/guide/colors#mode-aware-hue-aliases', FoundationTextHue],
  ['Quiet elevation', '/guide/colors#raised-surfaces', FoundationElevation],
  ['Interactive elevation', '/guide/colors#raised-surfaces', FoundationElevationState],
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
