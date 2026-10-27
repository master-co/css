import { IconArrowRight, IconBrandGithub, IconCode } from '@tabler/icons-react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import HomeAction from './HomeAction'
import { homeSections } from './home-content'

export default function CTASection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.getStarted} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <div className="position:relative overflow:hidden p-lg r-3xl outline-line-subtle outline-style:solid outline-width:1px bg-surface-raised shadow-lg p-xl@md">
          <div aria-hidden="true" className="position:absolute inset:0 opacity:0.64 pointer-events:none home-cta-glow" />
          <div className="position:relative grid-cols(1) align-items:center gap-2xl grid-cols(12)@lg">
            <div className="grid-col-span(7)@lg home-section-copy">
              <p className="home-section-label">{$('Get started')}</p>
              <h2 className="home-section-heading">{$('Start with one class string, then grow into a design system.')}</h2>
            </div>
            <div className="display:flex flex-wrap:wrap justify-content:flex-start gap-md grid-col-span(5)@lg justify-content:flex-end@lg">
              <HomeAction href="/guide/introduction" variant="primary">
                {$('Get started')}
                <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
              </HomeAction>
              <HomeAction href="/guide/syntax-tutorial" variant="secondary">
                <IconCode aria-hidden="true" size={16} stroke={1.75} />
                {$('Syntax tutorial')}
              </HomeAction>
              <HomeAction href="https://github.com/master-co/css" variant="secondary">
                <IconBrandGithub aria-hidden="true" size={16} stroke={1.75} />
                GitHub
              </HomeAction>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
