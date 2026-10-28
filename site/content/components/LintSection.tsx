import './lint.css'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeBentoFrame, HomeSectionHeader } from './HomeBento'
import LintExplorer from './LintExplorer'
import { homeSections, lintRules } from './home-content'
import { lintRuleReach } from './lint-content'

export default function LintSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.codeDiagnostics} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
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
