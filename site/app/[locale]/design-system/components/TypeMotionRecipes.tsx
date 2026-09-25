import '~/site/styles/demo-interactions.css'
import { FoundationTypography, FoundationTypeComparison, FoundationMotion, FoundationTransition, FoundationDialog } from '~/site/components/demo/FoundationTypeMotion'

const examples = [
  ['Type hierarchy', '/guide/typography#overview', FoundationTypography],
  ['Size and treatment', '/guide/typography#without-vs-with--textsize', FoundationTypeComparison],
  ['Finite entrances', '/guide/motion#overview', FoundationMotion],
  ['State transition', '/guide/motion#use-transition-shorthands', FoundationTransition],
  ['Dialog entrance', '/guide/motion#customize-motion-tokens', FoundationDialog],
] as const

export default function TypeMotionRecipes() {
  return <div>{examples.map(([title, href, Component], index) => <section key={title} data-type-motion-recipe={index}>
    <div className="demo-recipe-heading"><h3>{title}</h3><a href={href} className="demo-recipe-link">View guide ↗</a></div>
    <Component />
  </section>)}</div>
}
