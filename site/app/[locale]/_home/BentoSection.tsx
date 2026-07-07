import { Fragment } from 'react'
import clsx from 'clsx'
import { getColor } from '~/internal/data/color-palette'
import { MotionSection } from './HomeMotion'
import ThemeModesPreview from './ThemeModesPreview'
import { bentoRows, homeSections, p3PaletteColorNames, p3PaletteTiers, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type BentoRowContent, type BentoTileContent, type Translate } from './home-content'

const p3PaletteGridStyle = {
    gridTemplateColumns: `3.25rem repeat(${p3PaletteColorNames.length}, minmax(2.75rem, 1fr))`,
    gridTemplateRows: `1rem repeat(${p3PaletteTiers.length}, clamp(2.2rem, 3.4vw, 2.45rem))`
}

const p3PaletteCanvasStyle = {
    width: 'max(100%, 74rem)'
}

const p3PaletteDotGridStyle = {
    backgroundImage: 'radial-gradient(var(--color-line-muted) 1px, transparent 1px)',
    backgroundSize: '14px 14px'
}

const bentoCardClassName = 'flex flex-col r:2xl outline:1px|solid|subtle surface:base'
const bentoCardHeaderClassName = 'flex flex-col p:2xl'
const bentoCardTitleClassName = 'mx:0 mb:0 font:2xl font:medium text:strong'
const bentoCardBodyClassName = 'max-w:64ch mx:0 mb:0 mt:sm text:sm text:muted'
const bentoVisualClassName = 'rel overflow:hidden mx:calc(var(--spacing-sm)-1px) mb:calc(var(--spacing-sm)-1px) mt:auto r:xl outline:1px|solid|subtle bg:surface-muted'

export default function BentoSection({ t }: { t: Translate }) {
    return (
        <MotionSection homeSection={homeSections.designSystem} id={homeSections.designSystem} className="py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <p className={sectionLabelClassName + ' text:yellow'}>{t('Styling system')}</p>
                    <h2 className={sectionHeadingClassName}>
                        {t('Styling modern interfaces.')}
                    </h2>
                    <p className={sectionBodyClassName}>
                        {t('Compose layout, tokens, responsive rules, and interaction states from one readable syntax.')}
                    </p>
                </div>

                <div className="mx:-md mt:10x p:calc(var(--spacing-md)+1px) r:4xl surface:muted">
                    <div className="grid gap:calc(var(--spacing-md)+1px)">
                        {bentoRows.map((row) => (
                            <BentoGridRow key={row.title} row={row} t={t} />
                        ))}
                    </div>
                </div>
            </div>
        </MotionSection>
    )
}

function BentoGridRow({ t, row }: { t: Translate; row: BentoRowContent }) {
    if (row.visual === 'p3-palette') {
        return (
            <div className={clsx('grid gap:calc(var(--spacing-md)+1px)', row.gridClassName)}>
                <P3PaletteCard row={row} t={t} />
            </div>
        )
    }

    const tiles = row.tiles || Array.from({ length: row.gridCount }, (_, index) => ({
        title: row.gridCount > 1 ? `${row.title} ${index + 1}` : row.title,
        body: row.body
    }))

    return (
        <div className={clsx('grid gap:calc(var(--spacing-md)+1px)', row.gridClassName)}>
            {tiles.map((tile) => (
                tile.visual === 'theme-modes'
                    ? <ThemeModesCard key={tile.title} t={t} tile={tile} />
                    : <BentoPlaceholderCard key={tile.title} t={t} tile={tile} />
            ))}
        </div>
    )
}

function BentoPlaceholderCard({ t, tile }: { t: Translate; tile: BentoTileContent }) {
    return (
        <article className={bentoCardClassName}>
            <div className={bentoCardHeaderClassName}>
                <h3 className={bentoCardTitleClassName}>
                    {t(tile.title)}
                </h3>
                <p className={bentoCardBodyClassName}>{t(tile.body)}</p>
            </div>
            <div className={clsx(bentoVisualClassName, 'h:28x')} />
        </article>
    )
}

function ThemeModesCard({ t, tile }: { t: Translate; tile: BentoTileContent }) {
    return (
        <article className={bentoCardClassName}>
            <div className={bentoCardHeaderClassName}>
                <h3 className={bentoCardTitleClassName}>
                    {t(tile.title)}
                </h3>
                <p className={bentoCardBodyClassName}>{t(tile.body)}</p>
            </div>

            <ThemeModesPreview className={bentoVisualClassName} />
        </article>
    )
}

function P3PaletteCard({ t, row }: { t: Translate; row: BentoRowContent }) {
    return (
        <article className={bentoCardClassName}>
            <div className={bentoCardHeaderClassName}>
                <h3 className={bentoCardTitleClassName}>
                    {t(row.title)}
                </h3>
                <p className={bentoCardBodyClassName}>{t(row.body)}</p>
            </div>

            <P3PalettePreview />
        </article>
    )
}

function P3PalettePreview() {
    return (
        <div
            aria-label="P3 palette tiers from 100 through 0"
            className={bentoVisualClassName}
            role="img">
            <div aria-hidden="true" className="abs inset:0 opacity:.8 pointer-events:none" style={p3PaletteDotGridStyle} />

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
