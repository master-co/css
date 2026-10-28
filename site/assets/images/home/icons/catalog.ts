import type { FunctionComponent, SVGProps } from 'react'
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

/** Preview and handoff metadata. Import individual SVGs at the actual placement. */
export const homeIconGroups = [
  { id: 'sections', label: 'Section marks', description: 'Seven waypoints through the homepage.' },
  { id: 'design', label: 'Design system', description: 'Themes, tokens and native CSS foundations.' },
  { id: 'editor', label: 'Editor', description: 'Tools for reading and writing class names.' },
  { id: 'rendering', label: 'Rendering', description: 'Three paths from class names to CSS.' },
  { id: 'agents', label: 'AI agents', description: 'Connected clients and a reviewable workflow.' },
  { id: 'workflow', label: 'Workflow', description: 'Shared foundations across projects and routes.' },
  { id: 'lint', label: 'Lint checks', description: 'Six checks, with optically simplified small versions.' },
  { id: 'mcp', label: 'MCP tools', description: 'Nine tools, with a matching small version of each.' },
] as const

export type HomeIconGroup = typeof homeIconGroups[number]['id']

export interface HomeIconDefinition {
  id: string
  group: HomeIconGroup
  label: string
  target: { section: HomeSectionId, item?: string }
  placement: 'section' | 'card' | 'item'
  concept: string
  recommendedSize: 80 | 32
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>
  CompactIcon?: FunctionComponent<SVGProps<SVGSVGElement>>
}

/** 41 original themes; the 15 dense-list themes also have a redrawn 32-unit version. */
export const homeIcons = [
  {
    id: 'section-design-system', group: 'sections', label: 'Design system',
    target: { section: 'design-system' }, placement: 'section',
    concept: 'Modules arranged on a shared drafting frame.',
    recommendedSize: 80, Icon: SectionDesignSystem
  },
  {
    id: 'section-editor', group: 'sections', label: 'Editor',
    target: { section: 'language-service' }, placement: 'section',
    concept: 'An editing plane, a pencil and an insertion point.',
    recommendedSize: 80, Icon: SectionEditor
  },
  {
    id: 'section-rendering', group: 'sections', label: 'Rendering',
    target: { section: 'delivery-modes' }, placement: 'section',
    concept: 'One source branches into three delivery targets.',
    recommendedSize: 80, Icon: SectionRendering
  },
  {
    id: 'section-css-size', group: 'sections', label: 'CSS size',
    target: { section: 'css-cost' }, placement: 'section',
    concept: 'A bundle of rules contracts beside a measurement rail.',
    recommendedSize: 80, Icon: SectionCssSize
  },
  {
    id: 'section-lint', group: 'sections', label: 'Lint',
    target: { section: 'code-diagnostics' }, placement: 'section',
    concept: 'A calibration ruler checks three rows.',
    recommendedSize: 80, Icon: SectionLint
  },
  {
    id: 'section-ai-agents', group: 'sections', label: 'AI agents',
    target: { section: 'ai-agents' }, placement: 'section',
    concept: 'Connected agents form a loop around a checked result.',
    recommendedSize: 80, Icon: SectionAiAgents
  },
  {
    id: 'section-workflow', group: 'sections', label: 'Workflow',
    target: { section: 'development-workflow' }, placement: 'section',
    concept: 'Three workstations connect in a stepped sequence.',
    recommendedSize: 80, Icon: SectionWorkflow
  },
  {
    id: 'design-theme-modes', group: 'design', label: 'Light and dark, same markup',
    target: { section: 'design-system', item: 'theme-modes' }, placement: 'card',
    concept: 'One panel, two lighting conditions, a shared outline.',
    recommendedSize: 80, Icon: DesignThemeModes
  },
  {
    id: 'design-theme-tokens', group: 'design', label: 'Tokens, defined once',
    target: { section: 'design-system', item: 'theme-variables' }, placement: 'card',
    concept: 'A single reference supplies three different properties.',
    recommendedSize: 80, Icon: DesignThemeTokens
  },
  {
    id: 'design-p3-gamut', group: 'design', label: 'Wide-gamut color',
    target: { section: 'design-system', item: 'p3-palette' }, placement: 'card',
    concept: 'An outer gamut encloses a smaller sampled triangle.',
    recommendedSize: 80, Icon: DesignP3Gamut
  },
  {
    id: 'design-layout-motion', group: 'design', label: 'Layout and motion, together',
    target: { section: 'design-system', item: 'art-gallery' }, placement: 'card',
    concept: 'A grid cell follows a curved path out of its layout.',
    recommendedSize: 80, Icon: DesignLayoutMotion
  },
  {
    id: 'design-cascade-layers', group: 'design', label: 'Native CSS, in predictable layers',
    target: { section: 'design-system', item: 'cascade-layers' }, placement: 'card',
    concept: 'Five separated planes share one registration axis.',
    recommendedSize: 80, Icon: DesignCascadeLayers
  },
  {
    id: 'editor-hover-inspection', group: 'editor', label: 'Hover inspection',
    target: { section: 'language-service', item: 'hover-inspection' }, placement: 'card',
    concept: 'A pointer opens a cross-section above a class string.',
    recommendedSize: 80, Icon: EditorHoverInspection
  },
  {
    id: 'editor-manifest-completions', group: 'editor', label: 'Manifest completions',
    target: { section: 'language-service', item: 'manifest-aware-suggestions' }, placement: 'card',
    concept: 'An unfinished input connects to a selected candidate.',
    recommendedSize: 80, Icon: EditorManifestCompletions
  },
  {
    id: 'editor-focused-highlighting', group: 'editor', label: 'Focused highlighting',
    target: { section: 'language-service', item: 'active-syntax-highlighting' }, placement: 'card',
    concept: 'An inspection frame isolates one line in an editing plane.',
    recommendedSize: 80, Icon: EditorFocusedHighlighting
  },
  {
    id: 'editor-color-tools', group: 'editor', label: 'Color tools',
    target: { section: 'language-service', item: 'color-tools' }, placement: 'card',
    concept: 'A sampling probe meets a measured color plane.',
    recommendedSize: 80, Icon: EditorColorTools
  },
  {
    id: 'render-static', group: 'rendering', label: 'Static rendering',
    target: { section: 'delivery-modes', item: 'static' }, placement: 'card',
    concept: 'Source fragments resolve into a finished stylesheet.',
    recommendedSize: 80, Icon: RenderStatic
  },
  {
    id: 'render-progressive', group: 'rendering', label: 'Progressive rendering',
    target: { section: 'delivery-modes', item: 'progressive' }, placement: 'card',
    concept: 'A prepared panel receives one additional piece.',
    recommendedSize: 80, Icon: RenderProgressive
  },
  {
    id: 'render-runtime', group: 'rendering', label: 'Runtime rendering',
    target: { section: 'delivery-modes', item: 'runtime' }, placement: 'card',
    concept: 'New rule blocks assemble inside a browser frame.',
    recommendedSize: 80, Icon: RenderRuntime
  },
  {
    id: 'agent-check-preview-apply', group: 'agents', label: 'Lint, preview, then apply',
    target: { section: 'ai-agents', item: 'agent-session' }, placement: 'card',
    concept: 'Three staggered stages check, compare and confirm.',
    recommendedSize: 80, Icon: AgentCheckPreviewApply
  },
  {
    id: 'agent-clients', group: 'agents', label: 'Works with your agent',
    target: { section: 'ai-agents', item: 'mcp-clients' }, placement: 'card',
    concept: 'Different connectors share one project hub.',
    recommendedSize: 80, Icon: AgentClients
  },
  {
    id: 'agent-project-tools', group: 'agents', label: 'Project tools',
    target: { section: 'ai-agents', item: 'mcp-tools' }, placement: 'card',
    concept: 'Three distinct tool heads share a modular rack.',
    recommendedSize: 80, Icon: AgentProjectTools
  },
  {
    id: 'workflow-integrations', group: 'workflow', label: 'Framework integrations',
    target: { section: 'development-workflow', item: 'frameworks' }, placement: 'card',
    concept: 'Complementary connectors meet across an open gap.',
    recommendedSize: 80, Icon: WorkflowIntegrations
  },
  {
    id: 'workflow-trace-change', group: 'workflow', label: 'Trace a change',
    target: { section: 'development-workflow', item: 'impact' }, placement: 'card',
    concept: 'One changed node reaches three dependent nodes.',
    recommendedSize: 80, Icon: WorkflowTraceChange
  },
  {
    id: 'workflow-monorepo', group: 'workflow', label: 'Monorepo-aware',
    target: { section: 'development-workflow', item: 'workspaces' }, placement: 'card',
    concept: 'Multiple project blocks share a foundation.',
    recommendedSize: 80, Icon: WorkflowMonorepo
  },
  {
    id: 'workflow-route-styles', group: 'workflow', label: 'Route-level styles',
    target: { section: 'development-workflow', item: 'routes' }, placement: 'card',
    concept: 'A source branches into routes carrying their own sheets.',
    recommendedSize: 80, Icon: WorkflowRouteStyles
  },
  {
    id: 'lint-invalid-classes', group: 'lint', label: 'Invalid classes',
    target: { section: 'code-diagnostics', item: 'Invalid classes' }, placement: 'item',
    concept: 'A malformed piece fails to pass a calibrated opening.',
    recommendedSize: 32, Icon: LintInvalidClasses, CompactIcon: LintInvalidClassesCompact
  },
  {
    id: 'lint-class-order', group: 'lint', label: 'Class order',
    target: { section: 'code-diagnostics', item: 'Class order' }, placement: 'item',
    concept: 'Uneven source rows settle into an ordered column.',
    recommendedSize: 32, Icon: LintClassOrder, CompactIcon: LintClassOrderCompact
  },
  {
    id: 'lint-conflicting-classes', group: 'lint', label: 'Conflicting classes',
    target: { section: 'code-diagnostics', item: 'Conflicting classes' }, placement: 'item',
    concept: 'Two paths compete for the same destination slot.',
    recommendedSize: 32, Icon: LintConflictingClasses, CompactIcon: LintConflictingClassesCompact
  },
  {
    id: 'lint-strict-vocabulary', group: 'lint', label: 'Strict vocabulary',
    target: { section: 'code-diagnostics', item: 'Strict vocabulary' }, placement: 'item',
    concept: 'A shaped opening admits only a matching piece.',
    recommendedSize: 32, Icon: LintStrictVocabulary, CompactIcon: LintStrictVocabularyCompact
  },
  {
    id: 'lint-theme-tokens', group: 'lint', label: 'Theme tokens',
    target: { section: 'code-diagnostics', item: 'Theme tokens' }, placement: 'item',
    concept: 'Raw values align with a named reference on a ruler.',
    recommendedSize: 32, Icon: LintThemeTokens, CompactIcon: LintThemeTokensCompact
  },
  {
    id: 'lint-fix-previews', group: 'lint', label: 'Fix previews',
    target: { section: 'code-diagnostics', item: 'Fix previews' }, placement: 'item',
    concept: 'Before and after sheets carry minus and plus marks.',
    recommendedSize: 32, Icon: LintFixPreviews, CompactIcon: LintFixPreviewsCompact
  },
  {
    id: 'mcp-scan-project', group: 'mcp', label: 'Scan project',
    target: { section: 'ai-agents', item: 'mastercss_scan_project' }, placement: 'item',
    concept: 'A scan line crosses a source sheet inside a capture frame.',
    recommendedSize: 32, Icon: McpScanProject, CompactIcon: McpScanProjectCompact
  },
  {
    id: 'mcp-manifest-query', group: 'mcp', label: 'Query manifest',
    target: { section: 'ai-agents', item: 'mastercss_manifest_query' }, placement: 'item',
    concept: 'Indexed records sit above a searchable drawer.',
    recommendedSize: 32, Icon: McpManifestQuery, CompactIcon: McpManifestQueryCompact
  },
  {
    id: 'mcp-inspect-class', group: 'mcp', label: 'Inspect class',
    target: { section: 'ai-agents', item: 'mastercss_inspect_class' }, placement: 'item',
    concept: 'A single source piece unfolds into inspectable lines.',
    recommendedSize: 32, Icon: McpInspectClass, CompactIcon: McpInspectClassCompact
  },
  {
    id: 'mcp-trace-class', group: 'mcp', label: 'Trace class',
    target: { section: 'ai-agents', item: 'mastercss_trace_class' }, placement: 'item',
    concept: 'A continuous path links source, intermediate node and output.',
    recommendedSize: 32, Icon: McpTraceClass, CompactIcon: McpTraceClassCompact
  },
  {
    id: 'mcp-render-css', group: 'mcp', label: 'Render CSS',
    target: { section: 'ai-agents', item: 'mastercss_render_css' }, placement: 'item',
    concept: 'Rule fragments pass through a funnel into an output sheet.',
    recommendedSize: 32, Icon: McpRenderCss, CompactIcon: McpRenderCssCompact
  },
  {
    id: 'mcp-lint-project', group: 'mcp', label: 'Lint project',
    target: { section: 'ai-agents', item: 'mastercss_lint_project' }, placement: 'item',
    concept: 'A shield verifies a collection of source sheets.',
    recommendedSize: 32, Icon: McpLintProject, CompactIcon: McpLintProjectCompact
  },
  {
    id: 'mcp-css-compare', group: 'mcp', label: 'Compare CSS',
    target: { section: 'ai-agents', item: 'mastercss_css_compare' }, placement: 'item',
    concept: 'A bridge compares the same position in two outputs.',
    recommendedSize: 32, Icon: McpCssCompare, CompactIcon: McpCssCompareCompact
  },
  {
    id: 'mcp-preview-fixes', group: 'mcp', label: 'Preview fixes',
    target: { section: 'ai-agents', item: 'mastercss_preview_fixes' }, placement: 'item',
    concept: 'An eye examines additions and removals before confirmation.',
    recommendedSize: 32, Icon: McpPreviewFixes, CompactIcon: McpPreviewFixesCompact
  },
  {
    id: 'mcp-apply-preview', group: 'mcp', label: 'Apply preview',
    target: { section: 'ai-agents', item: 'mastercss_apply_preview' }, placement: 'item',
    concept: 'A confirmed piece is directed into its target sheet.',
    recommendedSize: 32, Icon: McpApplyPreview, CompactIcon: McpApplyPreviewCompact
  },
] as const satisfies readonly HomeIconDefinition[]

export type HomeIconId = typeof homeIcons[number]['id']
