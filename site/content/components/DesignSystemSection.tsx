import { Fragment } from 'react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { getColor } from '~/site/docs-shell/data/color-palette'
import ArtGalleryPreview from './ArtGalleryPreview'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import ThemeModesPreview from './ThemeModesPreview'
import { designSystemRows, homeSections, nativeCssPrimitivesCode, p3PaletteColorNames, p3PaletteTiers, themeVariablesCode, type DesignSystemTileContent } from './home-content'

const p3PaletteGridStyle = {
  gridTemplateColumns: `3.25rem repeat(${p3PaletteColorNames.length}, minmax(2.5rem, 1fr))`,
  gridTemplateRows: `1rem repeat(${p3PaletteTiers.length}, clamp(2.2rem, 3.4vw, 2.45rem))`,
  // Wide enough for every swatch column; narrower cards clip it behind the fade.
  width: 'max(100%, 70.5rem)'
}

export default function DesignSystemSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.designSystem} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          label={$('Design system')}
          title={$('Build modern interfaces from one class vocabulary.')}
          body={$('Keep themes, tokens, layout, motion, and native CSS primitives readable in markup, with predictable generated CSS.')} />
        <HomeBentoFrame>
          <HomeBentoGrid>
            {designSystemRows.map((row) => (
              <HomeBentoGrid className={row.gridClassName} key={row.title}>
                {row.visual === 'p3-palette'
                  ? <HomeBentoCard title={$(row.title)} body={$(row.body)}><P3PalettePreview /></HomeBentoCard>
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
    <HomeBentoCard className={tile.gridColumnClassName} title={$(tile.title)} body={$(tile.body)}>
      {tile.visual === 'theme-modes' && <ThemeModesPreview className="h-md home-bento-visual" />}
      {tile.visual === 'art-gallery' && <ArtGalleryPreview className="h-md h-lg@md home-bento-visual" />}
      {tile.visual === 'theme-variables' && (
        <HomeCodeWindow className="h-md home-bento-visual home-bento-visual-top" lang="css" preClassName="height:100%" variant="embedded">
          {themeVariablesCode}
        </HomeCodeWindow>
      )}
      {tile.visual === 'native-css-primitives' && (
        <HomeCodeWindow className="h-md h-lg@md home-bento-visual home-bento-visual-top" lang="css" preClassName="height:100%" variant="embedded">
          {nativeCssPrimitivesCode}
        </HomeCodeWindow>
      )}
    </HomeBentoCard>
  )
}

function P3PalettePreview() {
  const $ = useTranslation()
  return (
    <div aria-label={$('P3 palette tiers from 100 through 0')} className="home-bento-visual" role="img">
      <div aria-hidden="true" className="position:absolute inset:0 opacity:0.8 pointer-events:none home-dot-grid" />
      <div aria-hidden="true" className="position:relative display:grid gap-2xs p-xl pointer-events:none" style={p3PaletteGridStyle}>
        <span />
        {p3PaletteColorNames.map((colorName) => (
          <span
            className="display:flex overflow:hidden align-items:center justify-content:center min-width:0 padding-inline:1px font-mono font-2xs line-height:1 text-overflow:ellipsis white-space:nowrap fg-text-muted"
            key={colorName}>
            {colorName}
          </span>
        ))}
        {p3PaletteTiers.map((tier) => (
          <Fragment key={tier}>
            <span className="display:flex align-items:center font-mono font-2xs font-variant-numeric:tabular-nums line-height:1 fg-text-muted">
              {tier}
            </span>
            {p3PaletteColorNames.map((colorName) => (
              <span
                className="display:block outline-line-subtle outline-offset:-1px outline-style:solid outline-width:1px"
                key={colorName}
                style={{ backgroundColor: getColor(colorName, tier) }} />
            ))}
          </Fragment>
        ))}
      </div>
      <div aria-hidden="true" className="position:absolute bottom:0 right:0 top:0 width:5rem background-image:linear-gradient(90deg,transparent,var(--color-surface-inset)) pointer-events:none display:none@md" />
    </div>
  )
}
