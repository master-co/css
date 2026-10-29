import type { FunctionComponent, SVGProps } from 'react'
import type { StaticImage } from '~/site/docs-shell/components/Image'
import { homeIconArtwork } from './artwork'
import type { HomeSectionId } from '~/site/content/components/home-content'
import SectionDesignSystem from './section-design-system.svg'
import SectionEditor from './section-editor.svg'
import SectionRendering from './section-rendering.svg'
import SectionCssSize from './section-css-size.svg'
import SectionLint from './section-lint.svg'
import SectionAiAgents from './section-ai-agents.svg'
import SectionWorkflow from './section-workflow.svg'
import DesignThemeModes from './design-theme-modes.svg'
import DesignThemeTokens from './design-theme-tokens.svg'
import DesignP3Gamut from './design-p3-gamut.svg'
import DesignLayoutMotion from './design-layout-motion.svg'
import DesignCascadeLayers from './design-cascade-layers.svg'
import EditorHoverInspection from './editor-hover-inspection.svg'
import EditorManifestCompletions from './editor-manifest-completions.svg'
import EditorFocusedHighlighting from './editor-focused-highlighting.svg'
import EditorColorTools from './editor-color-tools.svg'
import RenderStatic from './render-static.svg'
import RenderProgressive from './render-progressive.svg'
import RenderRuntime from './render-runtime.svg'
import AgentCheckPreviewApply from './agent-check-preview-apply.svg'
import AgentClients from './agent-clients.svg'
import AgentProjectTools from './agent-project-tools.svg'
import WorkflowIntegrations from './workflow-integrations.svg'
import WorkflowTraceChange from './workflow-trace-change.svg'
import WorkflowMonorepo from './workflow-monorepo.svg'
import WorkflowRouteStyles from './workflow-route-styles.svg'
import LintInvalidClasses from './lint-invalid-classes.svg'
import LintInvalidClassesCompact from './lint-invalid-classes-compact.svg'
import LintClassOrder from './lint-class-order.svg'
import LintClassOrderCompact from './lint-class-order-compact.svg'
import LintConflictingClasses from './lint-conflicting-classes.svg'
import LintConflictingClassesCompact from './lint-conflicting-classes-compact.svg'
import LintStrictVocabulary from './lint-strict-vocabulary.svg'
import LintStrictVocabularyCompact from './lint-strict-vocabulary-compact.svg'
import LintThemeTokens from './lint-theme-tokens.svg'
import LintThemeTokensCompact from './lint-theme-tokens-compact.svg'
import LintFixPreviews from './lint-fix-previews.svg'
import LintFixPreviewsCompact from './lint-fix-previews-compact.svg'
import McpScanProject from './mcp-scan-project.svg'
import McpScanProjectCompact from './mcp-scan-project-compact.svg'
import McpManifestQuery from './mcp-manifest-query.svg'
import McpManifestQueryCompact from './mcp-manifest-query-compact.svg'
import McpInspectClass from './mcp-inspect-class.svg'
import McpInspectClassCompact from './mcp-inspect-class-compact.svg'
import McpTraceClass from './mcp-trace-class.svg'
import McpTraceClassCompact from './mcp-trace-class-compact.svg'
import McpRenderCss from './mcp-render-css.svg'
import McpRenderCssCompact from './mcp-render-css-compact.svg'
import McpLintProject from './mcp-lint-project.svg'
import McpLintProjectCompact from './mcp-lint-project-compact.svg'
import McpCssCompare from './mcp-css-compare.svg'
import McpCssCompareCompact from './mcp-css-compare-compact.svg'
import McpPreviewFixes from './mcp-preview-fixes.svg'
import McpPreviewFixesCompact from './mcp-preview-fixes-compact.svg'
import McpApplyPreview from './mcp-apply-preview.svg'
import McpApplyPreviewCompact from './mcp-apply-preview-compact.svg'

/** Preview and handoff metadata. Import individual assets at the actual placement. */
export const homeIconGroups = [
  { id: 'sections', label: 'Section marks', description: 'Seven waypoints through the homepage.' },
  { id: 'design', label: 'Design system', description: 'Themes, tokens and native CSS foundations.' },
  { id: 'editor', label: 'Editor', description: 'Tools for reading and writing class names.' },
  { id: 'rendering', label: 'Rendering', description: 'Three paths from class names to CSS.' },
  { id: 'agents', label: 'AI agents', description: 'Connected clients and a reviewable workflow.' },
  { id: 'workflow', label: 'Workflow', description: 'Shared foundations across projects and routes.' },
  { id: 'lint', label: 'Lint checks', description: 'Six checks, with archived compact vector studies.' },
  { id: 'mcp', label: 'MCP tools', description: 'Nine tools, with a matching glass illustration for each.' },
] as const

export type HomeIconGroup = typeof homeIconGroups[number]['id']

export interface HomeIconDefinition {
  id: string
  group: HomeIconGroup
  label: string
  target: { section: HomeSectionId, item?: string }
  placement: 'section' | 'card' | 'item'
  concept: string
  recommendedSize: 96 | 48 | 40
  artwork: { light: StaticImage, dark: StaticImage }
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>
  CompactIcon?: FunctionComponent<SVGProps<SVGSVGElement>>
}

/** 41 themed WebP illustrations; 15 dense-list themes also retain archived 32-unit SVG studies. */
export const homeIcons = [
  {
    id: 'section-design-system', group: 'sections', label: 'Design system',
    artwork: homeIconArtwork['section-design-system'],
    target: { section: 'design-system' }, placement: 'section',
    concept: 'Modules arranged on a shared drafting frame.',
    recommendedSize: 96, Icon: SectionDesignSystem
  },
  {
    id: 'section-editor', group: 'sections', label: 'Editor',
    artwork: homeIconArtwork['section-editor'],
    target: { section: 'language-service' }, placement: 'section',
    concept: 'A thin editing plane, one focused row and an independent pointer.',
    recommendedSize: 96, Icon: SectionEditor
  },
  {
    id: 'section-rendering', group: 'sections', label: 'Rendering',
    artwork: homeIconArtwork['section-rendering'],
    target: { section: 'delivery-modes' }, placement: 'section',
    concept: 'One source branches into three delivery targets.',
    recommendedSize: 96, Icon: SectionRendering
  },
  {
    id: 'section-css-size', group: 'sections', label: 'CSS size',
    artwork: homeIconArtwork['section-css-size'],
    target: { section: 'css-cost' }, placement: 'section',
    concept: 'A bundle of rules contracts beside a measurement rail.',
    recommendedSize: 96, Icon: SectionCssSize
  },
  {
    id: 'section-lint', group: 'sections', label: 'Lint',
    artwork: homeIconArtwork['section-lint'],
    target: { section: 'code-diagnostics' }, placement: 'section',
    concept: 'Three checkmarks verify three rows on a transparent editing plane.',
    recommendedSize: 96, Icon: SectionLint
  },
  {
    id: 'section-ai-agents', group: 'sections', label: 'AI agents',
    artwork: homeIconArtwork['section-ai-agents'],
    target: { section: 'ai-agents' }, placement: 'section',
    concept: 'Connected agents form a loop around a checked result.',
    recommendedSize: 96, Icon: SectionAiAgents
  },
  {
    id: 'section-workflow', group: 'sections', label: 'Workflow',
    artwork: homeIconArtwork['section-workflow'],
    target: { section: 'development-workflow' }, placement: 'section',
    concept: 'Three workstations connect in a stepped sequence.',
    recommendedSize: 96, Icon: SectionWorkflow
  },
  {
    id: 'design-theme-modes', group: 'design', label: 'Light and dark, same markup',
    artwork: homeIconArtwork['design-theme-modes'],
    target: { section: 'design-system', item: 'theme-modes' }, placement: 'card',
    concept: 'One panel, two lighting conditions, a shared outline.',
    recommendedSize: 96, Icon: DesignThemeModes
  },
  {
    id: 'design-theme-tokens', group: 'design', label: 'Tokens, defined once',
    artwork: homeIconArtwork['design-theme-tokens'],
    target: { section: 'design-system', item: 'theme-variables' }, placement: 'card',
    concept: 'A single reference supplies three different properties.',
    recommendedSize: 96, Icon: DesignThemeTokens
  },
  {
    id: 'design-p3-gamut', group: 'design', label: 'Wide-gamut color',
    artwork: homeIconArtwork['design-p3-gamut'],
    target: { section: 'design-system', item: 'p3-palette' }, placement: 'card',
    concept: 'An outer gamut encloses a smaller sampled triangle.',
    recommendedSize: 96, Icon: DesignP3Gamut
  },
  {
    id: 'design-layout-motion', group: 'design', label: 'Layout and motion, together',
    artwork: homeIconArtwork['design-layout-motion'],
    target: { section: 'design-system', item: 'art-gallery' }, placement: 'card',
    concept: 'A grid cell follows a curved path out of its layout.',
    recommendedSize: 96, Icon: DesignLayoutMotion
  },
  {
    id: 'design-cascade-layers', group: 'design', label: 'Native CSS, in predictable layers',
    artwork: homeIconArtwork['design-cascade-layers'],
    target: { section: 'design-system', item: 'cascade-layers' }, placement: 'card',
    concept: 'Five separated planes share one registration axis.',
    recommendedSize: 96, Icon: DesignCascadeLayers
  },
  {
    id: 'editor-hover-inspection', group: 'editor', label: 'Hover inspection',
    artwork: homeIconArtwork['editor-hover-inspection'],
    target: { section: 'language-service', item: 'hover-inspection' }, placement: 'card',
    concept: 'A pointer opens a cross-section above a class string.',
    recommendedSize: 96, Icon: EditorHoverInspection
  },
  {
    id: 'editor-manifest-completions', group: 'editor', label: 'Manifest completions',
    artwork: homeIconArtwork['editor-manifest-completions'],
    target: { section: 'language-service', item: 'manifest-aware-suggestions' }, placement: 'card',
    concept: 'An unfinished input connects to a selected candidate.',
    recommendedSize: 96, Icon: EditorManifestCompletions
  },
  {
    id: 'editor-focused-highlighting', group: 'editor', label: 'Focused highlighting',
    artwork: homeIconArtwork['editor-focused-highlighting'],
    target: { section: 'language-service', item: 'active-syntax-highlighting' }, placement: 'card',
    concept: 'An inspection frame isolates one line in an editing plane.',
    recommendedSize: 96, Icon: EditorFocusedHighlighting
  },
  {
    id: 'editor-color-tools', group: 'editor', label: 'Color tools',
    artwork: homeIconArtwork['editor-color-tools'],
    target: { section: 'language-service', item: 'color-tools' }, placement: 'card',
    concept: 'A floating sample disc connects to a point on a color coordinate plane.',
    recommendedSize: 96, Icon: EditorColorTools
  },
  {
    id: 'render-static', group: 'rendering', label: 'Static rendering',
    artwork: homeIconArtwork['render-static'],
    target: { section: 'delivery-modes', item: 'static' }, placement: 'card',
    concept: 'Source fragments resolve into a finished stylesheet.',
    recommendedSize: 96, Icon: RenderStatic
  },
  {
    id: 'render-progressive', group: 'rendering', label: 'Progressive rendering',
    artwork: homeIconArtwork['render-progressive'],
    target: { section: 'delivery-modes', item: 'progressive' }, placement: 'card',
    concept: 'A prepared panel receives one additional piece.',
    recommendedSize: 96, Icon: RenderProgressive
  },
  {
    id: 'render-runtime', group: 'rendering', label: 'Runtime rendering',
    artwork: homeIconArtwork['render-runtime'],
    target: { section: 'delivery-modes', item: 'runtime' }, placement: 'card',
    concept: 'New rule blocks assemble inside a browser frame.',
    recommendedSize: 96, Icon: RenderRuntime
  },
  {
    id: 'agent-check-preview-apply', group: 'agents', label: 'Lint, preview, then apply',
    artwork: homeIconArtwork['agent-check-preview-apply'],
    target: { section: 'ai-agents', item: 'agent-session' }, placement: 'card',
    concept: 'Three staggered stages check, compare and confirm.',
    recommendedSize: 96, Icon: AgentCheckPreviewApply
  },
  {
    id: 'agent-clients', group: 'agents', label: 'Works with your agent',
    artwork: homeIconArtwork['agent-clients'],
    target: { section: 'ai-agents', item: 'mcp-clients' }, placement: 'card',
    concept: 'Different connectors share one project hub.',
    recommendedSize: 96, Icon: AgentClients
  },
  {
    id: 'agent-project-tools', group: 'agents', label: 'Project tools',
    artwork: homeIconArtwork['agent-project-tools'],
    target: { section: 'ai-agents', item: 'mcp-tools' }, placement: 'card',
    concept: 'Three abstract capabilities dock into a shared transparent rail.',
    recommendedSize: 96, Icon: AgentProjectTools
  },
  {
    id: 'workflow-integrations', group: 'workflow', label: 'Framework integrations',
    artwork: homeIconArtwork['workflow-integrations'],
    target: { section: 'development-workflow', item: 'frameworks' }, placement: 'card',
    concept: 'Complementary connectors meet across an open gap.',
    recommendedSize: 96, Icon: WorkflowIntegrations
  },
  {
    id: 'workflow-trace-change', group: 'workflow', label: 'Trace a change',
    artwork: homeIconArtwork['workflow-trace-change'],
    target: { section: 'development-workflow', item: 'impact' }, placement: 'card',
    concept: 'One changed node reaches three dependent nodes.',
    recommendedSize: 96, Icon: WorkflowTraceChange
  },
  {
    id: 'workflow-monorepo', group: 'workflow', label: 'Monorepo-aware',
    artwork: homeIconArtwork['workflow-monorepo'],
    target: { section: 'development-workflow', item: 'workspaces' }, placement: 'card',
    concept: 'Three transparent project sheets share one thin foundation.',
    recommendedSize: 96, Icon: WorkflowMonorepo
  },
  {
    id: 'workflow-route-styles', group: 'workflow', label: 'Route-level styles',
    artwork: homeIconArtwork['workflow-route-styles'],
    target: { section: 'development-workflow', item: 'routes' }, placement: 'card',
    concept: 'A source branches into routes carrying their own sheets.',
    recommendedSize: 96, Icon: WorkflowRouteStyles
  },
  {
    id: 'lint-invalid-classes', group: 'lint', label: 'Invalid classes',
    artwork: homeIconArtwork['lint-invalid-classes'],
    target: { section: 'code-diagnostics', item: 'Invalid classes' }, placement: 'item',
    concept: 'A malformed piece fails to pass a calibrated opening.',
    recommendedSize: 48, Icon: LintInvalidClasses, CompactIcon: LintInvalidClassesCompact
  },
  {
    id: 'lint-class-order', group: 'lint', label: 'Class order',
    artwork: homeIconArtwork['lint-class-order'],
    target: { section: 'code-diagnostics', item: 'Class order' }, placement: 'item',
    concept: 'Uneven source rows settle into an ordered column.',
    recommendedSize: 48, Icon: LintClassOrder, CompactIcon: LintClassOrderCompact
  },
  {
    id: 'lint-conflicting-classes', group: 'lint', label: 'Conflicting classes',
    artwork: homeIconArtwork['lint-conflicting-classes'],
    target: { section: 'code-diagnostics', item: 'Conflicting classes' }, placement: 'item',
    concept: 'Two paths compete for the same destination slot.',
    recommendedSize: 48, Icon: LintConflictingClasses, CompactIcon: LintConflictingClassesCompact
  },
  {
    id: 'lint-strict-vocabulary', group: 'lint', label: 'Strict vocabulary',
    artwork: homeIconArtwork['lint-strict-vocabulary'],
    target: { section: 'code-diagnostics', item: 'Strict vocabulary' }, placement: 'item',
    concept: 'A shaped opening admits only a matching piece.',
    recommendedSize: 48, Icon: LintStrictVocabulary, CompactIcon: LintStrictVocabularyCompact
  },
  {
    id: 'lint-theme-tokens', group: 'lint', label: 'Theme tokens',
    artwork: homeIconArtwork['lint-theme-tokens'],
    target: { section: 'code-diagnostics', item: 'Theme tokens' }, placement: 'item',
    concept: 'Raw values align with a named reference on a ruler.',
    recommendedSize: 48, Icon: LintThemeTokens, CompactIcon: LintThemeTokensCompact
  },
  {
    id: 'lint-fix-previews', group: 'lint', label: 'Fix previews',
    artwork: homeIconArtwork['lint-fix-previews'],
    target: { section: 'code-diagnostics', item: 'Fix previews' }, placement: 'item',
    concept: 'Before and after sheets carry minus and plus marks.',
    recommendedSize: 48, Icon: LintFixPreviews, CompactIcon: LintFixPreviewsCompact
  },
  {
    id: 'mcp-scan-project', group: 'mcp', label: 'Scan project',
    artwork: homeIconArtwork['mcp-scan-project'],
    target: { section: 'ai-agents', item: 'mastercss_scan_project' }, placement: 'item',
    concept: 'A scan line crosses a source sheet inside a capture frame.',
    recommendedSize: 40, Icon: McpScanProject, CompactIcon: McpScanProjectCompact
  },
  {
    id: 'mcp-manifest-query', group: 'mcp', label: 'Query manifest',
    artwork: homeIconArtwork['mcp-manifest-query'],
    target: { section: 'ai-agents', item: 'mastercss_manifest_query' }, placement: 'item',
    concept: 'Staggered index sheets sit beside a separate inspection lens.',
    recommendedSize: 40, Icon: McpManifestQuery, CompactIcon: McpManifestQueryCompact
  },
  {
    id: 'mcp-inspect-class', group: 'mcp', label: 'Inspect class',
    artwork: homeIconArtwork['mcp-inspect-class'],
    target: { section: 'ai-agents', item: 'mastercss_inspect_class' }, placement: 'item',
    concept: 'A single source piece unfolds into inspectable lines.',
    recommendedSize: 40, Icon: McpInspectClass, CompactIcon: McpInspectClassCompact
  },
  {
    id: 'mcp-trace-class', group: 'mcp', label: 'Trace class',
    artwork: homeIconArtwork['mcp-trace-class'],
    target: { section: 'ai-agents', item: 'mastercss_trace_class' }, placement: 'item',
    concept: 'A continuous path links source, intermediate node and output.',
    recommendedSize: 40, Icon: McpTraceClass, CompactIcon: McpTraceClassCompact
  },
  {
    id: 'mcp-render-css', group: 'mcp', label: 'Render CSS',
    artwork: homeIconArtwork['mcp-render-css'],
    target: { section: 'ai-agents', item: 'mastercss_render_css' }, placement: 'item',
    concept: 'Separate rule fragments converge toward one output sheet.',
    recommendedSize: 40, Icon: McpRenderCss, CompactIcon: McpRenderCssCompact
  },
  {
    id: 'mcp-lint-project', group: 'mcp', label: 'Lint project',
    artwork: homeIconArtwork['mcp-lint-project'],
    target: { section: 'ai-agents', item: 'mastercss_lint_project' }, placement: 'item',
    concept: 'A circular check verifies a layered collection of source sheets.',
    recommendedSize: 40, Icon: McpLintProject, CompactIcon: McpLintProjectCompact
  },
  {
    id: 'mcp-css-compare', group: 'mcp', label: 'Compare CSS',
    artwork: homeIconArtwork['mcp-css-compare'],
    target: { section: 'ai-agents', item: 'mastercss_css_compare' }, placement: 'item',
    concept: 'A double-ended arrow compares two clearly separated outputs.',
    recommendedSize: 40, Icon: McpCssCompare, CompactIcon: McpCssCompareCompact
  },
  {
    id: 'mcp-preview-fixes', group: 'mcp', label: 'Preview fixes',
    artwork: homeIconArtwork['mcp-preview-fixes'],
    target: { section: 'ai-agents', item: 'mastercss_preview_fixes' }, placement: 'item',
    concept: 'An eye examines additions and removals before confirmation.',
    recommendedSize: 40, Icon: McpPreviewFixes, CompactIcon: McpPreviewFixesCompact
  },
  {
    id: 'mcp-apply-preview', group: 'mcp', label: 'Apply preview',
    artwork: homeIconArtwork['mcp-apply-preview'],
    target: { section: 'ai-agents', item: 'mastercss_apply_preview' }, placement: 'item',
    concept: 'A confirmed piece is directed into its target sheet.',
    recommendedSize: 40, Icon: McpApplyPreview, CompactIcon: McpApplyPreviewCompact
  },
] as const satisfies readonly HomeIconDefinition[]

export type HomeIconId = typeof homeIcons[number]['id']
