import './hero.css'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import CopyCommand from './CopyCommand'
import HeroCanvas from './HeroCanvas'
import HomeAction from './HomeAction'
import { homeSections, installCommand } from './home-content'

/** A flat glass title and softly frosted controls float over a sculpted matte gold field. */
export default function HeroSection() {
  const $ = useTranslation()
  return (
    <section data-glyph-host id={homeSections.hero} className="position:relative overflow:hidden isolation:isolate home-hero">
      <HeroCanvas className="home-hero-field" />
      <div className="position:relative app-wrapper home-hero-body home-section-wrap">
        <Link className="home-glass home-hero-pill" href="/guide/mcp-server">
          <span className="home-hero-pill-badge">{$('New')}</span>
          <span className="home-hero-pill-label">{$('An MCP server for your AI agents')}</span>
          <IconArrowRight aria-hidden="true" size={14} stroke={1.75} />
        </Link>
        <h1 className="home-display" data-glass-title>
          <span className="home-display-line">{$('A markup-driven CSS orchestration language')}</span>
          <span className="home-title-gap"> </span>
          <span className="home-display-line">{$('for developers\u00a0and AI agents.')}</span>
        </h1>
        <div className="home-hero-actions">
          <HomeAction href="/guide/introduction" variant="primary">
            {$('Get started')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </HomeAction>
          <CopyCommand command={installCommand} wrap />
        </div>
      </div>
    </section>
  )
}
