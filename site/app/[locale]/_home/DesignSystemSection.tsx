import { Fragment } from 'react'
import clsx from 'clsx'
import { getColor } from '~/internal/data/color-palette'
import { MotionSection } from './HomeMotion'
import ArtGalleryPreview from './ArtGalleryPreview'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, homeBentoCardBodyClassName, homeBentoCardHeaderClassName, homeBentoCardTitleClassName, homeBentoDotGridStyle, homeBentoTopVisualClassName, homeBentoVisualClassName } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import ThemeModesPreview from './ThemeModesPreview'
import { designSystemRows, homeSections, nativeCssPrimitivesCode, p3PaletteColorNames, p3PaletteTiers, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, themeVariablesCode, type DesignSystemRowContent, type DesignSystemTileContent, type Translate } from './home-content'

const p3PaletteGridStyle = {
    gridTemplateColumns: `3.25rem repeat(${p3PaletteColorNames.length}, minmax(2.75rem, 1fr))`,
    gridTemplateRows: `1rem repeat(${p3PaletteTiers.length}, clamp(2.2rem, 3.4vw, 2.45rem))`
}

const p3PaletteCanvasStyle = {
    width: 'max(100%, 74rem)'
}

export default function DesignSystemSection({ t }: { t: Translate }) {
    return (
        <MotionSection homeSection={homeSections.designSystem} id={homeSections.designSystem} className="py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <p className={sectionLabelClassName}>{t('Design system')}</p>
                    <h2 className={sectionHeadingClassName}>
                        {t('Build modern interfaces from one class vocabulary.')}
                    </h2>
                    <p className={sectionBodyClassName}>
                        {t('Keep themes, tokens, layout, motion, and native CSS primitives readable in markup, with predictable generated CSS.')}
                    </p>
                </div>

                <HomeBentoFrame>
                    <HomeBentoGrid>
                        {designSystemRows.map((row) => (
                            <DesignSystemGridRow key={row.title} row={row} t={t} />
                        ))}
                    </HomeBentoGrid>
                </HomeBentoFrame>
            </div>
        </MotionSection>
    )
}

function DesignSystemGridRow({ t, row }: { t: Translate; row: DesignSystemRowContent }) {
    if (row.visual === 'p3-palette') {
        return (
            <HomeBentoGrid className={row.gridClassName}>
                <P3PaletteCard row={row} t={t} />
            </HomeBentoGrid>
        )
    }

    const tiles: readonly DesignSystemTileContent[] = row.tiles || Array.from({ length: row.gridCount }, (_, index) => ({
        title: row.gridCount > 1 ? `${row.title} ${index + 1}` : row.title,
        body: row.body
    }))

    return (
        <HomeBentoGrid className={row.gridClassName}>
            {tiles.map((tile) => (
                tile.visual === 'theme-modes'
                    ? <ThemeModesCard key={tile.title} t={t} tile={tile} />
                    : tile.visual === 'theme-variables'
                        ? <ThemeVariablesCard key={tile.title} t={t} tile={tile} />
                        : tile.visual === 'art-gallery'
                            ? <ArtGalleryCard key={tile.title} t={t} tile={tile} />
                            : tile.visual === 'native-css-primitives'
                                ? <NativeCssPrimitivesCard key={tile.title} t={t} tile={tile} />
                                : <DesignSystemPlaceholderCard key={tile.title} t={t} tile={tile} />
            ))}
        </HomeBentoGrid>
    )
}

function DesignSystemPlaceholderCard({ t, tile }: { t: Translate; tile: DesignSystemTileContent }) {
    return (
        <HomeBentoCard className={tile.gridColumnClassName}>
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(tile.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(tile.body)}</p>
            </div>
            <div className={clsx(homeBentoVisualClassName, 'h:28x')} />
        </HomeBentoCard>
    )
}

function ThemeModesCard({ t, tile }: { t: Translate; tile: DesignSystemTileContent }) {
    return (
        <HomeBentoCard className={tile.gridColumnClassName}>
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(tile.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(tile.body)}</p>
            </div>

            <ThemeModesPreview className={homeBentoVisualClassName} />
        </HomeBentoCard>
    )
}

function ThemeVariablesCard({ t, tile }: { t: Translate; tile: DesignSystemTileContent }) {
    return (
        <HomeBentoCard className={tile.gridColumnClassName}>
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(tile.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(tile.body)}</p>
            </div>

            <HomeCodeWindow
                className={clsx(homeBentoTopVisualClassName, 'h:md')}
                preClassName="h:full"
                lang="css"
                variant="embedded">
                {themeVariablesCode}
            </HomeCodeWindow>
        </HomeBentoCard>
    )
}

function ArtGalleryCard({ t, tile }: { t: Translate; tile: DesignSystemTileContent }) {
    return (
        <HomeBentoCard className={tile.gridColumnClassName}>
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(tile.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(tile.body)}</p>
            </div>

            <ArtGalleryPreview className={homeBentoVisualClassName} />
        </HomeBentoCard>
    )
}

function NativeCssPrimitivesCard({ t, tile }: { t: Translate; tile: DesignSystemTileContent }) {
    return (
        <HomeBentoCard className={tile.gridColumnClassName}>
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(tile.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(tile.body)}</p>
            </div>

            <HomeCodeWindow
                className={clsx(homeBentoTopVisualClassName, 'h:md h:lg@md')}
                preClassName="h:full"
                lang="css"
                variant="embedded">
                {nativeCssPrimitivesCode}
            </HomeCodeWindow>
        </HomeBentoCard>
    )
}

function P3PaletteCard({ t, row }: { t: Translate; row: DesignSystemRowContent }) {
    return (
        <HomeBentoCard>
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(row.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(row.body)}</p>
            </div>

            <P3PalettePreview />
        </HomeBentoCard>
    )
}

function P3PalettePreview() {
    return (
        <div
            aria-label="P3 palette tiers from 100 through 0"
            className={homeBentoVisualClassName}
            role="img">
            <div aria-hidden="true" className="abs inset:0 opacity:.8 pointer-events:none" style={homeBentoDotGridStyle} />

            <div aria-hidden="true" className="rel z:1 p:xl pointer-events:none" style={p3PaletteCanvasStyle}>
                <div className="grid gap:2xs" style={p3PaletteGridStyle}>
                    <span />
                    {p3PaletteColorNames.map((colorName) => (
                        <span
                            className="flex overflow:hidden items-center justify-center min-w:0 px:1px font:2xs font:mono leading:1 text-ellipsis white-space:nowrap text:muted"
                            key={`label-${colorName}`}>
                            {colorName}
                        </span>
                    ))}
                    {p3PaletteTiers.map((tier) => (
                        <Fragment key={tier}>
                            <div className="flex items-center tabular-nums font:2xs font:mono leading:1 text:muted">
                                {tier}
                            </div>
                            {p3PaletteColorNames.map((colorName) => (
                                <span
                                    className="block size:full outline:1px|solid|subtle outline-offset:-1px"
                                    key={`${colorName}-${tier}`}
                                    style={{ backgroundColor: getColor(colorName, tier) }} />
                            ))}
                        </Fragment>
                    ))}
                </div>
            </div>

            <div aria-hidden="true" className="abs bottom:0 right:0 top:0 z:2 w:20x bg:linear-gradient(90deg,transparent,surface-muted) pointer-events:none hidden@md" />
        </div>
    )
}
