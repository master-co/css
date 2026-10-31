import './cta.css'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import CopyCommand from './CopyCommand'
import CTACanvas from './CTACanvas'
import { homeSections, installCommand } from './home-content'

/** The close: one gold point opens into a field of silk and stone threads below a centered invitation, under the section's own lamp. */
export default function CTASection() {
  const $ = useTranslation()
  return (
    <section aria-labelledby="home-cta-title" id={homeSections.getStarted} className="home-cta-section home-section">
      <div className="app-wrapper home-section-wrap">
        <div className="home-cta">
          <h2 id="home-cta-title" className="home-cta-title">
            <span className="home-cta-title-start">{$('Start with one class string,')}</span>
            <span className="sr-only"> </span>
            <span className="home-cta-title-finish home-stone-type">{$('then grow into a\u00a0design system.')}</span>
          </h2>
          <div className="home-cta-actions">
            {/* The canvas lamp lights the title and these controls itself, so they carry no `home-lit`. */}
            <Link className="home-action home-cta-start home-stone home-stone-button" href="/guide/introduction">
              {$('Get started')}
              <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
            </Link>
            <CopyCommand command={installCommand} wrap />
          </div>
          <div className="home-cta-field" aria-hidden="true">
            <CTACanvas />
          </div>
        </div>
      </div>
    </section>
  )
}
