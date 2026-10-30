import './hero.css'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import CopyCommand from './CopyCommand'
import HeroCanvas from './HeroCanvas'
import HomeAction from './HomeAction'
import { homeSections, installCommand } from './home-content'

/** White glass type floats above gold silk; both materials share the pointer's light and ripples. */
export default function HeroSection() {
  const $ = useTranslation()
  return (
    <section data-glyph-host id={homeSections.hero} className="position:relative overflow:hidden isolation:isolate home-hero">
      <HeroCanvas className="home-hero-field" />
      <div className="position:relative app-wrapper home-hero-body home-section-wrap">
        <Link className="home-enter home-glass home-hero-pill" href="/guide/mcp-server">
          <span className="home-hero-pill-badge">{$('New')}</span>
          {$('An MCP server for your AI agents')}
          <IconArrowRight aria-hidden="true" size={14} stroke={1.75} />
        </Link>
        <h1 className="home-display" data-glass-title>
          <span className="home-display-line">{$('A markup-driven CSS orchestration language')}</span>
          <span className="home-title-gap"> </span>
          <span className="home-display-line">{$('for developers\u00a0and AI agents.')}</span>
        </h1>
        <p className="home-enter home-hero-lead">
          {$('Style in markup with classes and tokens. One manifest generates page CSS, with shared checks for your editor, build and AI agents.')}
        </p>
        <div className="home-enter home-hero-actions">
          <HomeAction href="/guide/introduction" variant="primary">
            {$('Get started')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </HomeAction>
          <CopyCommand command={installCommand} />
        </div>
      </div>
    </section>
  )
}
