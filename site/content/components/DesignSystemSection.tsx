import './design-system.css'
import { Fragment, type CSSProperties } from 'react'
import { IconArrowRight } from '@tabler/icons-react'
import clsx from 'clsx'
import Color from 'colorjs.io'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { getColor } from '~/site/docs-shell/data/color-palette'
import ArtGalleryPreview from './ArtGalleryPreview'
import CascadeLayers from './CascadeLayers'
import { PaletteExplorer } from './DesignSystemFigures'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import type { HomeIllustrationId } from './HomeIllustration'
import ThemeModesPreview from './ThemeModesPreview'
import { designSystemGuides } from './design-system-content'
import { designSystemPalette, designSystemTiles, homeSections, p3PaletteColorNames, p3PaletteTiers, themeVariablesCode, type DesignSystemTileContent } from './home-content'

type DesignSystemVisual = DesignSystemTileContent['visual'] | 'p3-palette'

const tileIcons = {
  'theme-modes': 'design-theme-modes',
  'theme-variables': 'design-theme-tokens',
  'art-gallery': 'design-layout-motion',
  'cascade-layers': 'design-cascade-layers',
  'p3-palette': 'design-p3-gamut'
} satisfies Record<DesignSystemVisual, HomeIllustrationId>

const p3PaletteGridStyle = {
  '--home-palette-columns': p3PaletteColorNames.length,
  '--home-palette-rows': p3PaletteTiers.length
} as CSSProperties

/** Every swatch with its class, preset value and gamut, so the client readout only reads attributes. */
const p3Swatches = p3PaletteTiers.map((tier) => p3PaletteColorNames.map((colorName) => {
  const value = getColor(colorName, tier)
  const color = new Color(value)
  return {
    colorName, tier, value, token: `bg-${colorName}-${tier}`,
    wide: !color.inGamut('srgb'), chroma: color.to('oklch').coords[1] ?? 0
  }
}))

export default function DesignSystemSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.designSystem} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          icon="section-design-system"
          index="01"
          label={$('Design system')}
          title={$('Build modern interfaces from one class vocabulary.')}
          body={$('Themes, tokens, wide-gamut color, layout and motion are all written as classes, and the CSS they generate stays predictable.')}>
          <Link className="home-section-link" href="/guide/theme">
            {$('Define your theme tokens')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        {/* Themes first, layout and layers side by side, then the full-width palette. */}
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(8)@md home-ds-row">
            {designSystemTiles.slice(0, 2).map((tile) => <DesignSystemTile key={tile.title} tile={tile} />)}
            {designSystemTiles.slice(2).map((tile) => <DesignSystemTile key={tile.title} tile={tile} />)}
            <P3Palette body={$(designSystemPalette.body)} title={$(designSystemPalette.title)} />
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}

function DesignSystemTile({ tile }: { tile: DesignSystemTileContent }) {
  const $ = useTranslation()
  return (
    <HomeBentoCard
      body={$(tile.body)}
      className={clsx('home-reveal-item', tile.gridColumnClassName)}
      hint={tile.visual === 'art-gallery' ? $('Click a photo to preview the transition.') : undefined}
      href={designSystemGuides[tile.visual]}
      icon={tileIcons[tile.visual]}
      title={$(tile.title)}>
      {tile.visual === 'theme-modes' && <ThemeModesPreview className="h-md (height:30rem)@xl home-bento-visual" />}
      {tile.visual === 'art-gallery' && <ArtGalleryPreview className="home-bento-visual home-gallery" />}
      {tile.visual === 'theme-variables' && <ThemeTokens />}
      {tile.visual === 'cascade-layers' && <CascadeLayers />}
    </HomeBentoCard>
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

/** The full-width palette closes the bento; its inspector stays beside the field in the same well. */
function P3Palette({ body, title }: { body: string, title: string }) {
  const $ = useTranslation()
  return (
    <HomeBentoCard
      body={body}
      className="grid-col-span(8)@md home-ds-palette home-reveal-item"
      href={designSystemGuides['p3-palette']}
      icon={tileIcons['p3-palette']}
      title={title}>
      <PaletteExplorer
        columns={p3PaletteColorNames.length}
        label={$('P3 palette tiers from 100 through 0')}
        summary={$('{count} colors · {tiers} tiers')
          .replace('{count}', String(p3PaletteColorNames.length * p3PaletteTiers.length))
          .replace('{tiers}', String(p3PaletteTiers.length))}>
        <P3PaletteField />
      </PaletteExplorer>
    </HomeBentoCard>
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
              data-name={swatch.colorName}
              data-tier={swatch.tier}
              data-chroma={swatch.chroma.toFixed(4)}
              data-column={colorIndex}
              data-row={tierIndex}
              data-token={swatch.token}
              data-value={swatch.value}
              id={`home-swatch-${swatch.colorName}-${swatch.tier}`}
              key={swatch.colorName}
              role="option"
              style={{ '--home-swatch-color': swatch.value } as CSSProperties} />
          ))}
        </Fragment>
      ))}
    </div>
  )
}
