import './cta.css'
import { IconArrowRight } from '@tabler/icons-react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import CopyCommand from './CopyCommand'
import HomeAction from './HomeAction'
import { homeSections, installCommand } from './home-content'

/** A centered invitation with a quiet opening line and a full-strength destination. */
export default function CTASection() {
  const $ = useTranslation()
  return (
    <section aria-labelledby="home-cta-title" id={homeSections.getStarted} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <div className="home-cta">
          <h2 id="home-cta-title" className="home-cta-title">
            <span className="home-cta-title-start">{$('Start with one class string,')}</span>
            <span className="home-title-gap"> </span>
            <span className="home-cta-title-finish">{$('then grow into a\u00a0design system.')}</span>
          </h2>
          <div className="home-cta-actions">
            <HomeAction href="/guide/introduction" variant="primary">
              {$('Get started')}
              <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
            </HomeAction>
            <CopyCommand command={installCommand} />
          </div>
        </div>
      </div>
    </section>
  )
}
