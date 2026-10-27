import './hero.css'
import { IconArrowRight, IconCode } from '@tabler/icons-react'
import { createRenderSessionSync } from '@master/css/node'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { getHomePageCSSSize } from '~/site/utils/home-page-css-size'
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
      <div aria-hidden="true" className="home-hero-veil" />
      <div className="position:relative app-wrapper home-section-wrap">
        <div className="display:flex flex-direction:column align-items:center max-w-6xl margin-inline:auto text-align:center home-rise">
          <Link className="home-glass home-hero-pill" href="/guide/mcp-server">
            <span className="home-hero-pill-badge">{$('New')}</span>
            {$('An MCP server for your AI agents')}
            <IconArrowRight aria-hidden="true" size={14} stroke={1.75} />
          </Link>
          <h1 className="home-display">
            <span className="display:block">{$('Maintainable styles,')}</span>
            <span className="display:block home-display-quiet">{$('right in markup.')}</span>
          </h1>
          <p className="home-hero-lead">
            {$('Write native CSS and design tokens as class names. Master CSS checks them, shows what each change affects, and generates CSS only for the classes in your code.')}
          </p>
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
        <div className="home-rise home-rise-delayed home-stage">
          <div className="home-stage-tilt">
            <HeroComposer problem={heroComposerProblem} rules={createComposerRules()} sortedTokens={[...heroComposerSortedTokens]} />
          </div>
        </div>
        <HomeHighlights />
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

function HomeHighlights() {
  const $ = useTranslation()
  const brotli = getHomePageCSSSize().find((mode) => mode.id === 'brotli')!
  const master = brotli.rows.find((row) => row.isMasterCSS)!
  const tailwind = brotli.rows.find((row) => row.name === 'Tailwind CSS')!
  const highlights = [
    { value: (master.bytes / 1000).toFixed(1), unit: 'kB', label: $('of CSS on the Master CSS docs page, Brotli') },
    // Floored so the headline never rounds up past the measured ratio.
    { value: String(Math.floor(tailwind.ratio)), unit: '×', label: $('less CSS than the Tailwind CSS docs page') },
    { value: '0', unit: 'kB', label: $('of runtime with the default static setup') },
    { value: '1', unit: '', label: $('set of Rust semantics, matched byte for byte in the browser') }
  ]
  return (
    <ul className="home-highlights">
      {highlights.map((highlight) => (
        <li className="home-highlight" key={highlight.label}>
          <strong className="home-highlight-value">
            {highlight.value}
            {highlight.unit && <span className={highlight.unit === '×' ? 'home-highlight-sign' : 'home-highlight-unit'}>{highlight.unit}</span>}
          </strong>
          <span className="home-highlight-label">{highlight.label}</span>
        </li>
      ))}
    </ul>
  )
}
