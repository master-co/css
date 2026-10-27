export const deliveryFlows = {
  runtime: {
    title: 'Runtime delivery',
    steps: [
      { title: 'Observe', description: 'Read connected elements and receive DOM class changes.' },
      { title: 'Ensure', description: 'Interpret complete classes with the project manifest.' },
      { title: 'Update', description: 'Insert or reuse native CSS rules in the runtime stylesheet.' }
    ],
    caption: 'DOM usage and cached CSS rules have separate lifecycles.'
  },
  progressive: {
    title: 'Progressive delivery',
    steps: [
      { title: 'Render', description: 'Generate CSS from the classes in the rendered page HTML.' },
      { title: 'Paint', description: 'Deliver the initial CSS in the HTML for the first screen.' },
      { title: 'Continue', description: 'Hydrate matching rules, then observe new DOM classes.' }
    ],
    caption: 'The page hydration manifest describes existing rules; the project manifest defines class meaning.'
  },
  hydration: {
    title: 'CSS hydration',
    steps: [
      { title: 'Read', description: 'Load the page hydration manifest and the existing stylesheet.' },
      { title: 'Validate', description: 'Compare the manifest with native rule order and resources.' },
      { title: 'Adopt', description: 'Reuse matching rules as runtime-managed rule objects.' }
    ],
    caption: 'A mismatch rebuilds CSS; a referenced manifest that cannot load or validate rejects startup.'
  },
  scanning: {
    title: 'From source to utilities',
    steps: [
      { title: 'Discover', description: 'Find app sources through integration defaults or explicit source directives.' },
      { title: 'Extract', description: 'Read complete candidate strings without executing application code.' },
      { title: 'Validate', description: 'Use the active manifest to generate supported utility and component rules.' }
    ],
    caption: 'Native class usage also feeds pruning, even when a class is not a Master CSS utility.'
  },
  pruning: {
    title: 'Native CSS pruning',
    steps: [
      { title: 'Collect usage', description: 'Read native class names from the root’s selected source files.' },
      { title: 'Filter rules', description: 'Keep selector branches that reference detected native classes.' },
      { title: 'Emit CSS', description: 'Preserve surviving native rules and their required managed resources.' }
    ],
    caption: 'Source usage is a conservative signal; pruning does not evaluate the live DOM.'
  },
  route: {
    title: 'Route stylesheet ownership',
    steps: [
      { title: 'Reference', description: 'Read project tokens and shared vocabulary at compile time.' },
      { title: 'Compose', description: 'Lower local declarations, variants and native selectors.' },
      { title: 'Load', description: 'Let the framework or bundler deliver the route’s CSS output.' }
    ],
    caption: '@reference supplies context. It does not load the global stylesheet or create a route boundary.'
  }
} as const

export type DeliveryFlowName = keyof typeof deliveryFlows

export function deliveryFlow(name: string) {
  if (!Object.hasOwn(deliveryFlows, name)) throw new Error(`Unknown delivery flow: ${name}`)
  return deliveryFlows[name as DeliveryFlowName]
}

export function deliveryFlowMarkdown(name: string) {
  const flow = deliveryFlow(name)
  return `**${flow.title}**\n\n${flow.steps.map((step, i) => `${i + 1}. **${step.title}.** ${step.description}`).join('\n')}\n\n${flow.caption}`
}
