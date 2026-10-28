import './lint.css'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeBentoFrame, HomeSectionHeader } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import LintExplorer from './LintExplorer'
import { homeSections, lintRules, lintSurfaces } from './home-content'

export default function LintSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.codeDiagnostics} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="05"
          label={$('Lint')}
          title={$('Lint classes against your project.')}
          body={$('ESLint, the CLI and the MCP server run the same rules and fixes: invalid classes, class order, conflicts, and the token policies you opt into.')}>
          <Link className="home-section-link" href="/guide/code-linting">
            {$('See every lint rule')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        <HomeBentoFrame className="home-reveal-item">
          <LintExplorer
            footer={(
              <p className="home-lint-surfaces">
                <span className="home-annotation">{$('Same rules in')}</span>
                {lintSurfaces.map((surface) => <span className="home-chip" key={surface}>{surface}</span>)}
              </p>
            )}
            rules={lintRules.map((rule) => ({ title: rule.title, body: rule.body, tag: rule.tag, file: rule.file, fix: rule.fix, problem: rule.problem }))}
            windows={lintRules.map((rule) => (
              <HomeCodeWindow
                fixPreviewCode={rule.fixPreviewCode && withMark(rule.fixPreviewCode, 'MARK', rule.fixMark)}
                key={rule.title}
                lang="html">
                {withMark(rule.code, rule.problem.severity === 'error' ? 'ERROR' : 'WARN', rule.mark)}
              </HomeCodeWindow>
            ))} />
        </HomeBentoFrame>
      </div>
    </section>
  )
}

/** Prefix a sample with the code block's word-mark directive, which underlines or marks `mark` in the lines below it. */
function withMark(code: string, kind: 'ERROR' | 'WARN' | 'MARK', mark?: string) {
  return mark ? `<!-- @${kind} ${mark} -->${code}` : code
}
