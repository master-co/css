import './cta.css'
import { IconArrowRight, IconCode } from '@tabler/icons-react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import CopyCommand from './CopyCommand'
import GlyphField from './GlyphField'
import HomeAction from './HomeAction'
import { glyphFieldLines, homeSections, installCommand } from './home-content'

/** The closing panel: the hero's character matrix again, on a dark stage over a receding grid. */
export default function CTASection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.getStarted} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <div className="home-cta-frame">
          <div className="home-cta" data-glyph-host>
            <GlyphField className="home-cta-field" lines={glyphFieldLines} />
            <div aria-hidden="true" className="home-cta-horizon">
              <div className="home-cta-floor" />
            </div>
            <div className="home-cta-body">
              <h2 className="home-cta-title">
                <span className="display:block">{$('Start with one class string,')}</span>{' '}
                <span className="display:block home-cta-title-quiet">{$('then grow into a design system.')}</span>
              </h2>
              <p className="home-cta-lead">{$('Add Master CSS to your framework, style in markup, and move shared decisions into tokens as the design settles.')}</p>
              <div className="display:flex flex-wrap:wrap justify-content:center gap-sm mt-xl">
                <HomeAction href="/guide/introduction" variant="primary">
                  {$('Get started')}
                  <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
                </HomeAction>
                <HomeAction href="/guide/syntax-tutorial" variant="secondary">
                  <IconCode aria-hidden="true" size={16} stroke={1.75} />
                  {$('Syntax tutorial')}
                </HomeAction>
              </div>
              <CopyCommand className="mt-lg" command={installCommand} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
