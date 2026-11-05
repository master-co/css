export const deliveryFlows = {
  'vite-coverage': {
    title: 'One app, three sets of classes',
    steps: [
      { title: 'Source → static CSS', description: 'The button source contains both bg-blue and bg-neutral. Static mode generates both rules before either state is selected.' },
      { title: 'Build HTML → pre-rendered CSS', description: 'The emitted HTML contains only an empty app mount point. It has neither button class, so pre-render mode generates neither button rule.' },
      { title: 'Connected DOM → runtime CSS', description: 'The first browser render connects a button with bg-blue. Runtime mode generates that rule; switching to bg-neutral later generates its rule too.' }
    ],
    caption: 'These are alternative generation inputs for the same client-rendered app. Changing a class can reuse existing static CSS; an empty HTML mount point provides no initial button rules.'
  },
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
      { title: 'Resolve', description: 'Use the active manifest to generate rules for recognized Master CSS classes.' }
    ],
    caption: 'Native class usage also feeds pruning, even when a class is not a Master CSS utility.'
  },
  pruning: {
    title: 'Native CSS pruning',
    steps: [
      { title: 'Collect usage', description: 'Read native class names from the root’s selected source files.' },
      { title: 'Filter rules', description: 'Each file chooses its own preserve/prune policy. An opted-in imported file uses the importing root’s selected class usage; the root’s pruning directive does not propagate into imports.' },
      { title: 'Emit CSS', description: 'Keep surviving native rules. Under pruning, retained animation declarations and tokens retain required keyframes; same-name definitions keep their conditions, layers and order.' }
    ],
    caption: 'Source usage is a conservative signal; pruning does not evaluate the live DOM.'
  },
  'pruning-scope': {
    title: 'One shared source, two pruning scopes',
    steps: [
      { title: 'Share definitions', description: 'Both a.css and b.css import shared.css, which opts into native pruning and defines shared-card and only-used-in-b.' },
      { title: 'Select usage', description: 'Each root selects its own page.html. A uses shared-card; B uses shared-card and only-used-in-b.' },
      { title: 'Emit separately', description: 'A retains only shared-card from the shared source. B retains both rules. The shared source file itself is unchanged.' }
    ],
    caption: 'Each root filters the same shared source with its own selected usage. Only the shared source’s portion of each output is shown.'
  },
  nextjs: {
    title: 'Next.js progressive boundary',
    steps: [
      { title: 'Build-time HTML', description: 'Next.js emits static or pre-rendered HTML. The Master CSS build adapter inserts the generated CSS and supplies page hydration data.' },
      { title: 'Request-time HTML', description: 'A dynamic SSR response is produced after the build adapter has finished. This integration does not pre-render its generated CSS; progressive mode relies on the browser runtime for those rules.' }
    ],
    caption: 'Verify a pre-rendered page and a dynamic route separately. Build-time CSS coverage does not establish request-time SSR coverage.'
  },
  route: {
    title: 'Shared definitions, local CSS delivery',
    steps: [
      { title: 'Reference', description: 'Read project tokens and shared vocabulary at compile time.' },
      { title: 'Compile', description: 'Emit the route’s native rules and the variables or managed keyframes they use; do not copy unrelated global native rules.' },
      { title: 'Load', description: 'Let the framework or bundler deliver the route’s CSS output.' }
    ],
    caption: 'Definition context does not load global native rules. The framework delivers route CSS; its import does not isolate selectors.'
  }
} as const

export type DeliveryFlowName = keyof typeof deliveryFlows

/** Short figure labels and alternatives share the delivery content owner. */
export const deliveryIllustrations = {
  'vite-coverage': {
    alt: 'Static mode sees both source variants, pre-render mode sees neither in the empty HTML mount point, and runtime mode sees the connected blue button.',
    labels: { static: 'Static', prerender: 'Pre-render', runtime: 'Runtime', source: 'Source', html: 'Build HTML', dom: 'Connected DOM', blue: "'bg-blue'", neutral: "'bg-neutral'", mount: '<div id="app">', mountEnd: '</div>', button: '<button', buttonClass: 'class="bg-blue">', buttonEnd: '</button>', css: 'Generated rules', blueRule: '.bg-blue', neutralRule: '.bg-neutral', empty: 'No button rules', sourceResult: 'Both states covered', htmlResult: 'No button in HTML', domResult: 'Current state covered' }
  },
  scanning: {
    alt: 'Complete strings are extracted from source files, then resolved against project definitions to generate CSS.',
    labels: { source: 'Source files', redSource: "'bg-red-60'", greenSource: "'bg-green-60'", extract: 'Extract', candidates: 'Candidates', red: 'bg-red-60', green: 'bg-green-60', definitions: 'Project definitions', context: 'Active manifest', resolve: 'Resolve', output: 'Generated CSS' }
  },
  pruning: {
    alt: 'A root shares selected class usage with imported CSS; each file chooses its own pruning policy.',
    labels: { usage: 'Selected sources', classes: 'Native class usage', entry: 'style.css', entryPolicy: '@prune native;', localPolicy: '@prune native;', imports: 'imports', local: 'cards.css', used: 'Used rules kept', external: 'vendor.css', default: 'No opt-in', all: 'Native rules kept', policy: 'Each file chooses its own policy' }
  },
  'pruning-scope': {
    alt: 'Two roots import shared.css. A keeps shared-card; B also keeps only-used-in-b because its selected page uses that class.',
    labels: { shared: 'shared.css', policy: '@prune native;', sharedCard: '.shared-card', sharedOnlyB: '.only-used-in-b', aUsage: 'A usage', bUsage: 'B usage', aOutput: 'A output', bOutput: 'B output', aCard: '.shared-card', bCard: '.shared-card', bOnlyB: '.only-used-in-b' }
  },
  route: {
    alt: 'The shared spacing-lg definition supplies context to home.css. Its pricing-card rule and the needed spacing variable appear in the local output, which the framework loads. Referencing definitions does not load unrelated native rules.',
    labels: { project: 'Project definitions', definitions: '--spacing-lg: 1.5rem;', outputDefinition: '--spacing-lg: 1.5rem;', outputNative: '.pricing-card {', outputDeclaration: 'padding: var(--spacing-lg);', close: '}', outputClose: '}', context: 'Definition context', route: 'home.css', native: '.pricing-card {', declaration: 'padding: var(--spacing-lg);', compile: 'compile', output: 'Local output · excerpts', resources: 'Used variable', rule: 'Native rule', load: 'CSS import', page: 'Framework loads CSS' }
  },
  nextjs: {
    alt: 'The Next.js adapter processes build-time HTML; request-time dynamic SSR relies on browser rule generation.',
    labels: { build: 'Build time', request: 'Request time', static: 'Pre-rendered', dynamic: 'Dynamic SSR', staticHTML: 'Page HTML', dynamicHTML: 'Page HTML', adapter: 'Build adapter', css: 'CSS + manifest', outside: 'Outside the', boundary: 'build adapter', initial: 'Initial CSS', runtime: 'Runtime CSS', ready: 'Before startup', generate: 'Browser generation' }
  },
  progressive: {
    alt: 'HTML brings initial CSS to the browser; an uncovered class triggers the deferred engine and additional CSS.',
    labels: { host: 'Build / server', browser: 'Browser', html: 'HTML', inline: 'Inline CSS', trigger: 'New class', condition: 'outside page manifest', engine: 'Engine + program', output: 'New CSS' }
  },
  runtime: {
    alt: 'Connected DOM class usage flows through the browser engine into native stylesheet rules.',
    labels: { dom: 'Connected DOM', heading: '<h2>', paragraph: '<p>', candidate: 'text-center', sharedCandidate: 'text-center', engine: 'Engine + program', insert: 'Insert / reuse', rules: 'CSS rules', selector: '.text-center {', declaration: 'text-align: center;', close: '}' }
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

export function deliveryFlowMarkdown(name: string, flow = deliveryFlow(name)) {
  return `**${flow.title}**\n\n${flow.steps.map((step, i) => `${i + 1}. **${step.title}.** ${step.description}`).join('\n')}\n\n${flow.caption}`
}

export function deliveryFlowDescription(name: string) {
  const flow = deliveryFlow(name)
  return `${flow.steps.map(step => step.description).join(' ')} ${flow.caption}`
}
