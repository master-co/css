import './design-system.css'
import { Fragment, type CSSProperties } from 'react'
import clsx from 'clsx'
import Color from 'colorjs.io'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { getColor } from '~/site/docs-shell/data/color-palette'
import ArtGalleryPreview from './ArtGalleryPreview'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import ThemeModesPreview from './ThemeModesPreview'
import { cascadeLayers, designSystemRows, homeSections, p3PaletteColorNames, p3PaletteTiers, themeVariablesCode, type DesignSystemTileContent } from './home-content'

const p3PaletteGridStyle = {
  gridTemplateColumns: `2.5rem repeat(${p3PaletteColorNames.length}, minmax(2.25rem, 1fr))`,
  gridTemplateRows: `1rem repeat(${p3PaletteTiers.length}, 2.25rem)`
}

export default function DesignSystemSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.designSystem} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="01"
          label={$('Compose')}
          title={$('One vocabulary for your design system.')}
          body={$('Themes, tokens, layout and motion stay readable in markup, and the CSS they generate stays predictable.')} />
        <HomeBentoFrame>
          <HomeBentoGrid>
            {designSystemRows.map((row) => (
              <HomeBentoGrid className={row.gridClassName} key={row.title}>
                {row.visual === 'p3-palette'
                  ? <HomeBentoCard className="home-reveal-item" title={$(row.title)} body={$(row.body)}><P3PalettePreview /></HomeBentoCard>
                  : row.tiles.map((tile) => <DesignSystemTile key={tile.title} tile={tile} />)}
              </HomeBentoGrid>
            ))}
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}

function DesignSystemTile({ tile }: { tile: DesignSystemTileContent }) {
  const $ = useTranslation()
  return (
    <HomeBentoCard className={clsx('home-reveal-item', tile.gridColumnClassName)} title={$(tile.title)} body={$(tile.body)}>
      {tile.visual === 'theme-modes' && <ThemeModesPreview className="h-md home-bento-visual" />}
      {tile.visual === 'art-gallery' && <ArtGalleryPreview className="h-md h-lg@md home-bento-visual" />}
      {tile.visual === 'theme-variables' && (
        <HomeCodeWindow className="h-md home-bento-visual home-bento-visual-top" lang="css" preClassName="height:100%" variant="embedded">
          {themeVariablesCode}
        </HomeCodeWindow>
      )}
      {tile.visual === 'cascade-layers' && <CascadeLayers />}
    </HomeBentoCard>
  )
}

/** The preset cascade layers as stacked planes; they spread apart while the card is hovered. */
function CascadeLayers() {
  const $ = useTranslation()
  return (
    <div aria-label={$('Cascade layers from theme at the bottom to utilities at the top')} className="h-md h-lg@md home-bento-visual home-layers" role="img">
      <div aria-hidden="true" className="home-layers-scene">
        <div className="home-layers-stack">
          {cascadeLayers.map((layer, index) => (
            <div className="home-layer" data-layer={layer.name} key={layer.name} style={{ '--home-layer-index': index } as CSSProperties}>
              <span className="home-layer-name">@layer {layer.name}</span>
              <code className="home-layer-example">{layer.example}</code>
            </div>
          ))}
        </div>
      </div>
      <p aria-hidden="true" className="home-annotation home-layers-note">{$('Later layers win')}</p>
    </div>
  )
}

/** The P3 palette as an isometric field; swatches rise with chroma and flatten into a table on hover. */
function P3PalettePreview() {
  const $ = useTranslation()
  return (
    <div aria-label={$('P3 palette tiers from 100 through 0')} className="home-bento-visual home-palette-stage" role="img">
      <div aria-hidden="true" className="position:absolute inset:0 opacity:0.8 pointer-events:none home-dot-grid" />
      <p aria-hidden="true" className="home-palette-legend">
        <span className="home-annotation">↑ {$('Height: chroma')}</span>
        <span><span className="home-palette-legend-swatch" /><span className="home-annotation">{$('Rim: outside sRGB')}</span></span>
      </p>
      <div aria-hidden="true" className="home-palette-scene">
        <div className="home-palette" style={p3PaletteGridStyle}>
          <span />
          {p3PaletteColorNames.map((colorName) => (
            <span className="home-palette-label" key={colorName}>{colorName}</span>
          ))}
          {p3PaletteTiers.map((tier, tierIndex) => (
            <Fragment key={tier}>
              <span className="home-palette-label home-palette-tier">{tier}</span>
              {p3PaletteColorNames.map((colorName, colorIndex) => {
                const value = getColor(colorName, tier)
                const color = new Color(value)
                const wide = !color.inGamut('srgb')
                return (
                  <span
                    className={clsx('home-swatch', wide && 'home-swatch-wide')}
                    data-token={`bg-${colorName}-${tier}`}
                    key={colorName}
                    style={{ backgroundColor: value, '--home-swatch-index': colorIndex + tierIndex, '--home-swatch-lift': (color.to('oklch').coords[1] ?? 0).toFixed(3) } as CSSProperties} />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
