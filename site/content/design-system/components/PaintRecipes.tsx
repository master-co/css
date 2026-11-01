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
  return <div className="grid gap-2xl">
    <DemoPalette families={['blue', 'violet']} />
    {examples.map(([title, href, Component], index) => <section key={title} className="grid gap-sm" data-paint-recipe={index}>
      <div className="flex flex-wrap items-baseline justify-between gap-sm"><h3 className="m(0) font-md font-semibold fg-text-strong">{title}</h3><a href={href} className="font-sm fg-text-muted fg-text-strong:hover">View guide ↗</a></div>
      <Component />
    </section>)}
  </div>
}
