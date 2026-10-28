import LintInvalidClasses from '~/site/assets/images/home/icons/lint-invalid-classes-compact.svg'
import LintClassOrder from '~/site/assets/images/home/icons/lint-class-order-compact.svg'
import LintConflictingClasses from '~/site/assets/images/home/icons/lint-conflicting-classes-compact.svg'
import LintStrictVocabulary from '~/site/assets/images/home/icons/lint-strict-vocabulary-compact.svg'
import LintThemeTokens from '~/site/assets/images/home/icons/lint-theme-tokens-compact.svg'
import LintFixPreviews from '~/site/assets/images/home/icons/lint-fix-previews-compact.svg'
import McpScanProject from '~/site/assets/images/home/icons/mcp-scan-project-compact.svg'
import McpManifestQuery from '~/site/assets/images/home/icons/mcp-manifest-query-compact.svg'
import McpInspectClass from '~/site/assets/images/home/icons/mcp-inspect-class-compact.svg'
import McpTraceClass from '~/site/assets/images/home/icons/mcp-trace-class-compact.svg'
import McpRenderCss from '~/site/assets/images/home/icons/mcp-render-css-compact.svg'
import McpLintProject from '~/site/assets/images/home/icons/mcp-lint-project-compact.svg'
import McpCssCompare from '~/site/assets/images/home/icons/mcp-css-compare-compact.svg'
import McpPreviewFixes from '~/site/assets/images/home/icons/mcp-preview-fixes-compact.svg'
import McpApplyPreview from '~/site/assets/images/home/icons/mcp-apply-preview-compact.svg'

const compactIcons = {
  'lint-invalid-classes': LintInvalidClasses,
  'lint-class-order': LintClassOrder,
  'lint-conflicting-classes': LintConflictingClasses,
  'lint-strict-vocabulary': LintStrictVocabulary,
  'lint-theme-tokens': LintThemeTokens,
  'lint-fix-previews': LintFixPreviews,
  'mcp-scan-project': McpScanProject,
  'mcp-manifest-query': McpManifestQuery,
  'mcp-inspect-class': McpInspectClass,
  'mcp-trace-class': McpTraceClass,
  'mcp-render-css': McpRenderCss,
  'mcp-lint-project': McpLintProject,
  'mcp-css-compare': McpCssCompare,
  'mcp-preview-fixes': McpPreviewFixes,
  'mcp-apply-preview': McpApplyPreview,
} as const

export type HomeCompactIconId = keyof typeof compactIcons

/** Dedicated 32-unit drawings; kept on the server, including lint island slots. */
export default function HomeCompactIcon({ icon }: { icon: HomeCompactIconId }) {
  const Icon = compactIcons[icon]
  return <span aria-hidden="true" className="home-compact-icon" data-home-icon={icon}>
    <Icon aria-hidden="true" focusable="false" height={32} width={32} />
  </span>
}
