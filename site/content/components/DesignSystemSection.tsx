import './design-system.css'
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { createRenderSessionSync } from '@master/css/node'
import { IconArrowRight, IconCheck } from '@tabler/icons-react'
import clsx from 'clsx'
import Color from 'colorjs.io'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { getColor } from '~/site/docs-shell/data/color-palette'
import preset from '~/site/utils/preset-manifest'
import ArtGalleryPreview from './ArtGalleryPreview'
import { PaletteExplorer } from './DesignSystemFigures'
import { HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import ThemeModesPreview from './ThemeModesPreview'
import { cascadeProbe, designSystemGuides } from './design-system-content'
import { cascadeLayers, designSystemPalette, designSystemTiles, homeSections, p3PaletteColorNames, p3PaletteTiers, themeVariablesCode, type DesignSystemTileContent } from './home-content'

type DesignSystemVisual = DesignSystemTileContent['visual'] | 'p3-palette'

const p3PaletteGridStyle = {
  '--home-palette-columns': p3PaletteColorNames.length,
  '--home-palette-rows': p3PaletteTiers.length
} as CSSProperties

/** Every swatch with its class, preset value and gamut, so the client readout only reads attributes. */
const p3Swatches = p3PaletteTiers.map((tier) => p3PaletteColorNames.map((colorName) => {
  const value = getColor(colorName, tier)
  const color = new Color(value)
  return { colorName, tier, value, token: `bg-${colorName}-${tier}`, wide: !color.inGamut('srgb'), chroma: color.to('oklch').coords[1] ?? 0 }
}))

export default function DesignSystemSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.designSystem} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="01"
          label={$('Design system')}
          title={$('Build modern interfaces from one class vocabulary.')}
          body={$('Themes, tokens, wide-gamut color, layout and motion are all written as classes, and the CSS they generate stays predictable.')}>
          <Link className="home-section-link" href="/guide/theme">
            {$('Define your theme tokens')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        {/* One bento grid: themes, then primitives, then the palette across the full width as the last card. */}
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(6)@md home-ds-row">
            {designSystemTiles.map((tile) => <DesignSystemTile key={tile.title} tile={tile} />)}
            <P3Palette body={$(designSystemPalette.body)} title={$(designSystemPalette.title)} />
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}

/** A short title and line, then a quiet link to the guide that covers the figure. */
function DesignSystemCaption({ body, title, visual }: { body: string, title: string, visual: DesignSystemVisual }) {
  const $ = useTranslation()
  return (
    <>
      <h3 className="home-bento-card-title">{title}</h3>
      <p className="home-bento-card-body">{body}</p>
      <Link aria-label={`${$('See details')}: ${title}`} className="home-ds-link home-section-link" href={designSystemGuides[visual]}>
        {$('See details')}
        <IconArrowRight aria-hidden="true" size={15} stroke={1.75} />
      </Link>
    </>
  )
}

/** The bento card markup, with the guide link inside its header. */
function DesignSystemCard({ children, className, header }: { children: ReactNode, className?: string, header: ReactNode }) {
  return (
    <article className={clsx('home-bento-card', className)}>
      <div className="home-bento-card-header">{header}</div>
      {children}
    </article>
  )
}

function DesignSystemTile({ tile }: { tile: DesignSystemTileContent }) {
  const $ = useTranslation()
  return (
    <DesignSystemCard className={clsx('home-reveal-item', tile.gridColumnClassName)} header={<DesignSystemCaption body={$(tile.body)} title={$(tile.title)} visual={tile.visual} />}>
      {tile.visual === 'theme-modes' && <ThemeModesPreview className="h-md home-bento-visual" />}
      {tile.visual === 'art-gallery' && <ArtGalleryPreview className="home-bento-visual home-gallery" />}
      {tile.visual === 'theme-variables' && <ThemeTokens />}
      {tile.visual === 'cascade-layers' && <CascadeLayers />}
    </DesignSystemCard>
  )
}

/** The @theme sample; the theme preview beside it tints each light-dark() value by the share of the preview it paints. */
function ThemeTokens() {
  return (
    <div className="home-bento-visual home-tokens">
      <HomeCodeWindow className="home-tokens-code" lang="css">
        {themeVariablesCode}
      </HomeCodeWindow>
    </div>
  )
}

/** The layer the engine puts the probe's utility rule in. */
function getUtilityLayer() {
  const engine = createRenderSessionSync({ manifest: preset })
  try {
    const [rule] = engine.ensureClassRules([cascadeProbe.utility]).classRules[cascadeProbe.utility]
    return rule.layer as typeof cascadeLayers[number]['name']
  } finally {
    engine.dispose()
  }
}

/** The preset cascade layers as stacked slabs; the utility's rule sits above the component's and wins. */
function CascadeLayers() {
  const $ = useTranslation()
  const rules: Partial<Record<typeof cascadeLayers[number]['name'], { selector: string, wins: boolean }>> = {
    components: { selector: `.${cascadeProbe.component}`, wins: false },
    [getUtilityLayer()]: { selector: `.${cascadeProbe.utility}`, wins: true }
  }
  return (
    <div aria-label={`${$('Cascade layers from theme at the bottom to utilities at the top')}. ${$('The px-lg utility sets the padding over the btn component rule, because utilities come later.')}`} className="home-bento-visual home-layers" role="img">
      <p aria-hidden="true" className="home-layers-element">
        <span className="home-code-tag">&lt;{cascadeProbe.tag}</span> <span className="home-code-attr">class</span>=<span className="home-code-string">&quot;{cascadeProbe.classes.join(' ')}&quot;</span><span className="home-code-tag">&gt;</span>
      </p>
      <div aria-hidden="true" className="home-layers-scene">
        <div className="home-layers-stack">
          {cascadeLayers.map((layer, index) => (
            <div className="home-layer" data-wins={rules[layer.name]?.wins || undefined} key={layer.name} style={{ '--home-layer-index': index } as CSSProperties}>
              <span className="home-layer-name"><span className="home-layer-keyword">@layer</span> {layer.name}</span>
            </div>
          ))}
        </div>
        {/* A dimension line beside the stack ticks off each layer in order, bottom to top. */}
        <span className="home-layers-dimension" />
        {/* Callouts face the reader beside the slabs, raised by the same amount as the slab they name. */}
        {cascadeLayers.map((layer, index) => {
          const rule = rules[layer.name]
          return rule && (
            <p className="home-layer-callout" data-wins={rule.wins || undefined} key={layer.name} style={{ '--home-layer-index': index } as CSSProperties}>
              <code>{rule.selector}</code>
              {rule.wins && <IconCheck size={12} stroke={2.25} />}
            </p>
          )
        })}
      </div>
    </div>
  )
}

/** The P3 palette as the grid's last, full-width card: its caption and the readout share the header, the field sits in the well. */
function P3Palette({ body, title }: { body: string, title: string }) {
  const $ = useTranslation()
  return (
    <article className="grid-col-span(6)@md home-bento-card home-ds-palette home-reveal-item">
      <PaletteExplorer
        caption={<div className="home-bento-card-header"><DesignSystemCaption body={body} title={title} visual="p3-palette" /></div>}
        columns={p3PaletteColorNames.length}
        label={$('P3 palette tiers from 100 through 0')}
        mark={<p className="home-annotation home-palette-mark">↑ {$('Height: chroma')}</p>}>
        <P3PaletteField />
      </PaletteExplorer>
    </article>
  )
}

/** The P3 palette as an isometric field; swatches rise with chroma and flatten into a table on hover. */
function P3PaletteField() {
  return (
    <div className="home-palette" style={p3PaletteGridStyle}>
      <span aria-hidden="true" className="home-palette-label home-palette-name" />
      {p3PaletteColorNames.map((colorName) => (
        <span aria-hidden="true" className="home-palette-label home-palette-name" key={colorName}>{colorName}</span>
      ))}
      {p3Swatches.map((row, tierIndex) => (
        <Fragment key={p3PaletteTiers[tierIndex]}>
          <span aria-hidden="true" className="home-palette-label home-palette-tier">{p3PaletteTiers[tierIndex]}</span>
          {row.map((swatch, colorIndex) => (
            <span
              aria-label={`${swatch.token}, ${swatch.value}${swatch.wide ? ', P3' : ''}`}
              aria-selected={false}
              className="home-swatch"
              data-gamut={swatch.wide ? 'P3' : 'sRGB'}
              data-token={swatch.token}
              data-value={swatch.value}
              id={`home-swatch-${swatch.colorName}-${swatch.tier}`}
              key={swatch.colorName}
              role="option"
              style={{
                backgroundColor: swatch.value,
                '--home-swatch-index': colorIndex + tierIndex,
                '--home-swatch-column': colorIndex,
                '--home-swatch-lift': swatch.chroma.toFixed(3)
              } as CSSProperties} />
          ))}
        </Fragment>
      ))}
    </div>
  )
}
