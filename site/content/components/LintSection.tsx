import './lint.css'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeBentoFrame, HomeSectionHeader } from './HomeBento'
import HomeCompactIcon, { type HomeCompactIconId } from './HomeCompactIcon'
import LintExplorer from './LintExplorer'
import { homeSections, lintRules } from './home-content'
import { lintRuleReach } from './lint-content'

const ruleIcons: Record<string, HomeCompactIconId> = {
  'Invalid classes': 'lint-invalid-classes',
  'Class order': 'lint-class-order',
  'Conflicting classes': 'lint-conflicting-classes',
  'Strict vocabulary': 'lint-strict-vocabulary',
  'Theme tokens': 'lint-theme-tokens',
  'Fix previews': 'lint-fix-previews'
}

export default function LintSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.codeDiagnostics} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          icon="section-lint"
          index="05"
          label={$('Lint')}
          title={$('Lint classes against your project.')}
          body={$('ESLint in your editor, the CLI in your scripts and the MCP server for agents check classes with the same rules and fixes.')}>
          <Link className="home-section-link" href="/guide/code-linting">
            {$('See every lint rule')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        <HomeBentoFrame className="home-lint-frame home-marks home-reveal-item">
          <LintExplorer
            icons={lintRules.map(rule => <HomeCompactIcon icon={ruleIcons[rule.title]} key={rule.title} />)}
            rules={lintRules.map((rule) => ({
              title: rule.title,
              file: rule.file,
              code: rule.code,
              fixedCode: rule.fixPreviewCode,
              mark: rule.mark,
              problem: rule.problem,
              reach: lintRuleReach[rule.title]
            }))} />
        </HomeBentoFrame>
      </div>
    </section>
  )
}
