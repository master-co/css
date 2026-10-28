/**
 * Where each lint rule of the homepage explorer runs besides ESLint.
 * `home-content.test.ts` runs the same tooling the CLI and the MCP server use on every sample,
 * so a surface shows a report only when that surface reports exactly what ESLint does.
 */
export interface LintRuleReach {
  /** The CLI command that reports the sample, or applies its fix with `--fix`. */
  cli?: string
  /** The MCP tool that reports the sample, or previews its fix. */
  mcp?: 'mastercss_lint_content' | 'mastercss_preview_fixes'
  /** The `rules` argument when the rule is not in the recommended set. */
  rules?: 'all'
  /** A rule option only ESLint reads: the CLI and the MCP server report nothing for it, and their windows say so. */
  eslintOption?: string
}

export const lintRuleReach: Record<string, LintRuleReach> = {
  'Invalid classes': {
    cli: 'npx @master/css-cli lint --format stylish',
    mcp: 'mastercss_lint_content'
  },
  'Class order': {
    cli: 'npx @master/css-cli lint --format stylish',
    mcp: 'mastercss_lint_content'
  },
  'Conflicting classes': {
    cli: 'npx @master/css-cli lint --format stylish',
    mcp: 'mastercss_lint_content'
  },
  'Strict vocabulary': {
    eslintOption: 'disallowUnknownClass'
  },
  'Theme tokens': {
    cli: 'npx @master/css-cli lint --format stylish --rules all',
    mcp: 'mastercss_lint_content',
    rules: 'all'
  },
  'Fix previews': {
    cli: 'npx @master/css-cli lint --fix',
    mcp: 'mastercss_preview_fixes'
  }
}
