import './hero.css'
import { IconArrowRight } from '@tabler/icons-react'
import { createRenderSessionSync } from '@master/css/node'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import preset from '~/site/utils/preset-manifest'
import CopyCommand from './CopyCommand'
import GlyphField from './GlyphField'
import HeroComposer, { type HeroComposerRule } from './HeroComposer'
import HomeAction from './HomeAction'
import { glyphFieldLines, heroComposerProblem, heroComposerSortedTokens, heroComposerTokens, homeSections, installCommand } from './home-content'

export default function HeroSection() {
  const $ = useTranslation()
  return (
    <section data-glyph-host id={homeSections.hero} className="position:relative overflow:hidden isolation:isolate home-hero">
      <GlyphField className="home-hero-field" lines={glyphFieldLines} />
      <div className="position:relative app-wrapper home-section-wrap">
        <div className="home-hero-copy">
          <Link className="home-enter home-glass home-hero-pill" href="/guide/mcp-server">
            <span className="home-hero-pill-badge">{$('New')}</span>
            {$('An MCP server for your AI agents')}
            <IconArrowRight aria-hidden="true" size={14} stroke={1.75} />
          </Link>
          <h1 className="home-display">
            <span className="home-display-line home-enter">{$('The markup-driven CSS')}</span>{' '}
            <span className="home-display-line home-display-quiet home-enter">{$('language and framework')}</span>
          </h1>
          <p className="home-enter home-hero-lead">
            {$('Write CSS and design tokens as class names that people can read and AI agents can check. Master CSS generates only the CSS your pages use.')}
          </p>
          <div className="home-enter home-hero-actions">
            <HomeAction href="/guide/introduction" variant="primary">
              {$('Get started')}
              <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
            </HomeAction>
            <CopyCommand command={installCommand} />
          </div>
        </div>
        <div className="home-enter home-stage">
          <div className="home-stage-tilt">
            <HeroComposer problem={heroComposerProblem} rules={createComposerRules()} sortedTokens={[...heroComposerSortedTokens]} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Generated CSS for each composer class, split for display. */
function createComposerRules(): HeroComposerRule[] {
  const engine = createRenderSessionSync({ manifest: preset })
  try {
    const { classRules } = engine.ensureClassRules([...heroComposerTokens])
    return heroComposerTokens.map((token) => {
      const [rule] = classRules[token]
      const match = rule.text.match(/^([^{]+)\{([^}]*)\}$/)
      if (!match) throw new Error(`Unexpected rule for ${token}: ${rule.text}`)
      return {
        token,
        selector: match[1],
        declarations: match[2].split(';').filter(Boolean).map((declaration) => {
          const index = declaration.indexOf(':')
          return [declaration.slice(0, index), declaration.slice(index + 1)] as [string, string]
        })
      }
    })
  } finally {
    engine.dispose()
  }
}
