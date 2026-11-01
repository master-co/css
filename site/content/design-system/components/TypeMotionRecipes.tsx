import { FoundationTypography, FoundationTypeComparison, FoundationMotion, FoundationTransition, FoundationDialog } from '~/site/components/demo/FoundationTypeMotion'

const examples = [
  ['Type hierarchy', '/guide/typography#overview', FoundationTypography],
  ['Size and treatment', '/guide/typography#without-vs-with--text-token', FoundationTypeComparison],
  ['Finite entrances', '/reference/tokens/motion', FoundationMotion],
  ['State transition', '/reference/tokens/motion', FoundationTransition],
  ['Dialog entrance', '/guide/theme#define-motion-tokens', FoundationDialog],
] as const

export default function TypeMotionRecipes() {
  return <div className="grid gap-2xl">{examples.map(([title, href, Component], index) => <section key={title} className="grid gap-sm" data-type-motion-recipe={index}>
    <div className="flex flex-wrap items-baseline justify-between gap-sm"><h3 className="m(0) font-md font-semibold fg-text-strong">{title}</h3><a href={href} className="font-sm fg-text-muted fg-text-strong:hover">View guide ↗</a></div>
    <Component />
  </section>)}</div>
}
