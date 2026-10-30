export const deliveryFlows = {
  runtime: {
    title: 'Runtime delivery',
    steps: [
      { title: 'Observe', description: 'Read connected elements and receive DOM class changes.' },
      { title: 'Ensure', description: 'Execute complete classes with the compiled project program.' },
      { title: 'Update', description: 'Insert or reuse native CSS rules in the runtime stylesheet.' }
    ],
    caption: 'The browser engine inserts or reuses CSS rules. Cached rules can outlive their connected DOM usage.'
  },
  progressive: {
    title: 'Progressive delivery',
    steps: [
      { title: 'Render', description: 'Generate CSS from the classes in the rendered page HTML.' },
      { title: 'Deliver', description: 'Send the initial CSS with the HTML so the browser can apply it before runtime startup.' },
      { title: 'Continue', description: 'Read the page hydration manifest and track connected DOM classes. By default, a class outside that manifest loads the browser engine and project program, adopts matching existing rules, and generates any additional CSS.' }
    ],
    caption: 'Initial CSS arrives with the HTML. With a valid pre-rendered stylesheet and page manifest, the engine stays deferred until a connected class outside that manifest appears.'
  },
  hydration: {
    title: 'CSS hydration',
    steps: [
      { title: 'Read', description: 'Load the page hydration manifest; keep using the existing stylesheet.' },
      { title: 'Validate', description: 'When the browser engine starts, use the project program to replay manifest classes in server rule order, validate resources, and compare the generated rules with the existing CSSOM.' },
      { title: 'Adopt or rebuild', description: 'Reuse matching rules as runtime-managed rule objects. A mismatch rebuilds CSS.' }
    ],
    caption: 'When the engine starts, matching rules are adopted; a mismatch rebuilds CSS. A referenced manifest that cannot load or validate rejects startup before this comparison.'
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

/** Short figure labels and alternatives share the delivery content owner. */
export const deliveryIllustrations = {
  progressive: {
    alt: 'HTML brings initial CSS to the browser; an uncovered class triggers the deferred engine and additional CSS.',
    labels: { host: 'Build / server', browser: 'Browser', html: 'HTML', inline: 'Inline CSS', trigger: 'New class', condition: 'outside page manifest', engine: 'Engine + program', output: 'New CSS' }
  },
  runtime: {
    alt: 'Connected DOM class usage flows through the browser engine into native stylesheet rules.',
    labels: { dom: 'Connected DOM', heading: '<h2>', paragraph: '<p>', candidate: 'text-align:center', engine: 'Engine + program', insert: 'Insert / reuse', rules: 'CSS rules' }
  },
  hydration: {
    alt: 'Existing CSS is compared with engine replay of the page manifest; matching rules are adopted and a mismatch rebuilds CSS.',
    labels: { existing: 'Existing CSS', manifest: 'Page manifest', replay: 'Engine replay', compare: 'Compare', match: 'Match', mismatch: 'Mismatch', adopt: 'Adopt rules', rebuild: 'Rebuild CSS' }
  }
} as const

export function deliveryFlow(name: string) {
  if (!Object.hasOwn(deliveryFlows, name)) throw new Error(`Unknown delivery flow: ${name}`)
  return deliveryFlows[name as DeliveryFlowName]
}

export function deliveryFlowMarkdown(name: string) {
  const flow = deliveryFlow(name)
  return `**${flow.title}**\n\n${flow.steps.map((step, i) => `${i + 1}. **${step.title}.** ${step.description}`).join('\n')}\n\n${flow.caption}`
}

export function deliveryFlowDescription(name: string) {
  const flow = deliveryFlow(name)
  return `${flow.steps.map(step => step.description).join(' ')} ${flow.caption}`
}
