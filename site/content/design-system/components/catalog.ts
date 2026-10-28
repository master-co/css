export const materialRoles = [
  { name: 'Canvas', token: '--color-surface-canvas', description: 'The quiet ground around content.', className: 'ds-material-canvas' },
  { name: 'Shell', token: '--color-surface-shell', description: 'A close surround that holds the next layer.', className: 'ds-material-shell' },
  { name: 'Surface', token: '--color-surface-raised', description: 'An opaque face for reading and working.', className: 'ds-material-surface' },
] as const

export const canvasTreatments = [
  { background: 'plain', title: 'Plain', description: 'The default surface for reading a complete example.' },
  { background: 'stripes', title: 'Stripes', description: 'Mark measured gaps or otherwise empty space.' },
  { background: 'grid', title: 'Grid', description: 'Inspect alignment and positioning against regular lines.' },
  { background: 'dots', title: 'Dots', description: 'Compare placement against a sparse grid.' },
  { background: 'checkerboard', title: 'Checkerboard', description: 'Reveal transparency in an image or painted surface.' },
] as const

export const codeTableRecipeRows = [
  { syntax: '@layer(components)', css: '@layer components' },
  { syntax: '@motion-reduce', css: '@media (prefers-reduced-motion: reduce)' },
  { syntax: '@supports(<feature>)', css: '@supports (<feature>)' },
]

export const recipeGroups = [
  { id: 'project-style-recipes', title: 'Project styles and layers' },
  { id: 'foundation-recipes', title: 'Layout foundations' },
  { id: 'typography-motion-recipes', title: 'Typography and motion' },
  { id: 'color-elevation-recipes', title: 'Paint and color' },
  { id: 'namespace-recipes', title: 'Namespace comparisons' },
  { id: 'code-table-recipes', title: 'Code and table patterns' },
  { id: 'viewport-presets-gallery', title: 'Syntax and viewports' },
  { id: 'utility-recipes', title: 'Utility behavior recipes' },
] as const

export const componentGroups = [
  { id: 'primitives', title: 'Surfaces and specimens', entries: [
    { id: 'demo-canvas', slug: 'demo', title: 'Demo canvas', description: 'One quiet boundary around a complete example.' },
    { id: 'demo-surface', slug: 'surface', title: 'Surface', description: 'Flat and raised content with explicit geometry.' },
    { id: 'demo-item', slug: 'item', title: 'Item', description: 'Neutral context, a subject and a comparison.' },
    { id: 'demo-text', slug: 'text', title: 'Text', description: 'Body, lead and supporting copy.' },
    { id: 'demo-media', slug: 'media', title: 'Media', description: 'Original artwork, real images and useful proportions.' },
    { id: 'demo-swatch', slug: 'swatch', title: 'Swatch', description: 'A named color role with its actual paint.' },
    { id: 'demo-comparison', slug: 'comparison', title: 'Comparison', description: 'The same subject under two conditions.' },
    { id: 'assets', slug: 'asset', title: 'Downloadable assets', description: 'Transparent, light and dark artwork previews.' },
    { id: 'demo-badge', slug: 'badge', title: 'Badge', description: 'A small, legible state or category.' },
    { id: 'palette', slug: 'palette', title: 'Palette', description: 'Fixed preset colors with copy feedback.' },
  ] },
  { id: 'annotations', title: 'Controls and observation', entries: [
    { id: 'demo-controls', slug: 'controls', title: 'Controls', description: 'Native actions and fitted selected inserts.' },
    { id: 'copy', slug: 'copy', title: 'Copy', description: 'An accessible action with an honest result.' },
    { id: 'demo-viewport', slug: 'viewport', title: 'Viewport', description: 'Resize the real document inside an iframe.' },
    { id: 'container', slug: 'container', title: 'Container', description: 'Change local width while the page stays put.' },
    { id: 'demo-motion', slug: 'motion', title: 'Motion', description: 'Play, pause and replay native animations.' },
    { id: 'demo-scroll-area', slug: 'scroll', title: 'Scroll region', description: 'Keep overflow local and keyboard reachable.' },
    { id: 'demo-label', slug: 'label', title: 'Label', description: 'Name a condition outside the measured layout.' },
    { id: 'demo-legend', slug: 'legend', title: 'Legend', description: 'Pair every teaching color with a visible name.' },
    { id: 'demo-measure', slug: 'measure', title: 'Measurement', description: 'Read the browser’s actual width and height.' },
    { id: 'demo-axes', slug: 'axes', title: 'Axes', description: 'Explain physical directions around the subject.' },
    { id: 'platform-behavior', slug: 'feature-support', title: 'Platform behavior', description: 'Syntax checks and isolated view transitions.' },
  ] },
  { id: 'documents-and-evidence', title: 'Documents and evidence', entries: [
    { id: 'code', slug: 'code', title: 'Code windows', description: 'Source tabs, stable selection and native copying.' },
    { id: 'document-values', slug: 'documents', title: 'Document patterns', description: 'Options, disclosures and related choices.' },
    { id: 'tool-contracts', slug: 'parameters', title: 'Parameters and contracts', description: 'Complete input names, types and requirements.' },
    { id: 'tooling-documentation', slug: 'tooling', title: 'Tooling examples', description: 'Options and verified source/result pairs.' },
    { id: 'agent-documentation', slug: 'agent', title: 'Prompts and workflows', description: 'Copyable prose and explicit review steps.' },
    { id: 'package-apis', slug: 'package-api', title: 'API declarations', description: 'Import paths, symbols and full declarations.' },
    { id: 'stylesheet-examples', slug: 'stylesheet', title: 'Stylesheet examples', description: 'Literal CSS and its complete compiled output.' },
    { id: 'document-index', slug: 'documentation-index', title: 'Document index', description: 'Clear groups, readable links and useful starts.' },
    { id: 'document-steps', slug: 'steps', title: 'Steps', description: 'A sequence with code in the same reading flow.' },
    { id: 'utility-namespace-table', slug: 'utility-table', title: 'Utility table', description: 'Properties and namespaces from shared facts.' },
    { id: 'numeric-token-table', slug: 'numeric-table', title: 'Numeric tokens', description: 'Original values beside a useful comparison.' },
    { id: 'waterfall', slug: 'waterfall', title: 'Delivery diagram', description: 'Explain resource order with explicit context.' },
    { id: 'benchmark-charts', slug: 'chart-group', title: 'Chart group', description: 'Units, series and sample context together.' },
    { id: 'metrics', slug: 'metrics', title: 'Metric rows', description: 'Align values while preserving their caveats.' },
    { id: 'data-table', slug: 'data-table', title: 'Data table', description: 'Complete data in a named scroll region.' },
    { id: 'source', slug: 'source', title: 'Evidence footer', description: 'Keep the source and recorded date in view.' },
    { id: 'recipes', slug: 'catalog', title: 'Recipe catalog', description: 'Native disclosures for a complete collection.' },
  ] },
] as const

export function componentCatalogMarkdown() {
  return componentGroups.map(group => `### ${group.title} {#${group.id}}\n\n${group.entries.map(entry => `- [${entry.title}](/design-system/review/${entry.slug}) — ${entry.description}`).join('\n')}`).join('\n\n')
}
