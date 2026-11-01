/** The material ladder, from the page to an overlay; a well sits below its surroundings. */
export const materialRoles = [
  { name: 'Canvas', token: '--ui-surface-canvas', description: 'The page itself. Reading text sits directly on it.' },
  { name: 'Tray', token: '--ui-surface-tray', description: 'A recessed holder for one complete example: its head, stage, source and caption.' },
  { name: 'Stage', token: '--ui-surface-stage', description: 'A lit, slightly recessed well inside a tray where the specimen stands.' },
  { name: 'Sheet', token: '--ui-surface-sheet', description: 'A raised face: panels, cards, controls and specimens.' },
  { name: 'Well', token: '--ui-surface-well', description: 'A sunken field below its surroundings: inputs, tracks and pressed states.' },
  { name: 'Float', token: '--ui-surface-float', description: 'Menus, dialogs and tooltips above everything else.' },
] as const

export const elevationSteps = ['sink', 'flat', 'rise-1', 'rise-1h', 'rise-2', 'rise-3', 'overlay'] as const

export const canvasTreatments = [
  { background: 'plain', title: 'Plain', description: 'The default lit stage for reading a complete example.' },
  { background: 'hatch', title: 'Hatch', description: 'Mark measured gaps, padding or otherwise empty space.' },
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
  { id: 'surfaces', title: 'Surfaces and frames', entries: [
    { id: 'tray', slug: 'demo', title: 'Tray and stage', description: 'One complete example: head, stage, source and caption.' },
    { id: 'sheet', slug: 'surface', title: 'Sheet and well', description: 'Raised faces and sunken fields on one ladder.' },
    { id: 'compare', slug: 'comparison', title: 'Compare', description: 'The same subject under two named conditions.' },
    { id: 'browser', slug: 'viewport', title: 'Browser viewport', description: 'Resize a real document inside an iframe.' },
    { id: 'container', slug: 'container', title: 'Container', description: 'Change local width while the page stays put.' },
    { id: 'scroll', slug: 'scroll', title: 'Scroll region', description: 'Keep overflow local and keyboard reachable.' },
  ] },
  { id: 'specimens', title: 'Specimens and annotations', entries: [
    { id: 'item', slug: 'item', title: 'Item', description: 'A tile that stands for content, in a named tone.' },
    { id: 'badge', slug: 'badge', title: 'Badge', description: 'A small, legible state or category.' },
    { id: 'label', slug: 'label', title: 'Label', description: 'Name a condition outside the measured layout.' },
    { id: 'legend', slug: 'legend', title: 'Legend', description: 'Pair every teaching color with a visible name.' },
    { id: 'measure', slug: 'measure', title: 'Measure', description: 'Read the browser’s actual width and height.' },
    { id: 'axes', slug: 'axes', title: 'Axes', description: 'Explain physical directions around the subject.' },
    { id: 'swatch', slug: 'swatch', title: 'Swatch', description: 'A named role with its actual paint.' },
    { id: 'palette', slug: 'palette', title: 'Palette', description: 'Fixed preset colors with copy feedback.' },
    { id: 'media', slug: 'media', title: 'Media', description: 'Original artwork and real images with intrinsic size.' },
    { id: 'player', slug: 'motion', title: 'Player', description: 'Play, pause and replay native animations.' },
    { id: 'asset', slug: 'asset', title: 'Downloadable asset', description: 'Artwork on its intended ground with a download.' },
  ] },
  { id: 'controls', title: 'Controls', entries: [
    { id: 'buttons', slug: 'controls', title: 'Buttons and inputs', description: 'One material and one state order for every control.' },
    { id: 'copy', slug: 'copy', title: 'Copy', description: 'An accessible action with an honest result.' },
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
    { id: 'waterfall', slug: 'waterfall', title: 'Delivery diagram', description: 'Explain resource order on one time axis.' },
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
