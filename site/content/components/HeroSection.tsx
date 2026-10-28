import './hero.css'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import CopyCommand from './CopyCommand'
import HeroCanvas from './HeroCanvas'
import HomeAction from './HomeAction'
import { homeSections, installCommand } from './home-content'

/** The opening: the positioning line, centered over a sheet of gold grains that answers the pointer. */
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
        <h1 className="home-display">
          <span className="home-display-line home-enter">{$('A markup-driven CSS orchestration language')}</span>
          <span className="home-title-gap"> </span>
          <span className="home-display-line home-enter">{$('for developers\u00a0and AI agents.')}</span>
        </h1>
        <p className="home-enter home-hero-lead">
          {$('Style in markup with class names and design tokens. One project manifest generates only the CSS each page uses, and checks every class the same way in your editor, your build and your AI agents.')}
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
