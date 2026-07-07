import { Fragment } from 'react'
import clsx from 'clsx'
import { getColor } from '~/internal/data/color-palette'
import { MotionSection } from './HomeMotion'
import { bentoRows, homeSections, p3PaletteColorNames, p3PaletteTiers, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type BentoRowContent, type Translate } from './home-content'

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

    return (
        <div className={clsx('grid gap:calc(var(--spacing-md)+1px)', row.gridClassName)}>
            {Array.from({ length: row.gridCount }, (_, index) => (
                <article className="flex flex-col r:2xl outline:1px|solid|subtle surface:base" key={index}>
                    <div className="flex flex-col p:2xl">
                        <h3 className="mx:0 mb:0 font:2xl text:strong">
                            {t(row.title)}{row.gridCount > 1 && ` ${index + 1}`}
                        </h3>
                        <p className="max-w:48ch mx:0 mb:0 mt:sm text:sm text:muted">{t(row.body)}</p>
                    </div>
                    <div className="h:28x mt:auto r:xl outline:1px|solid|subtle bg:surface-muted" />
                </article>
            ))}
        </div>
    )
}

function P3PaletteCard({ t, row }: { t: Translate; row: BentoRowContent }) {
    return (
        <article className="flex flex-col r:2xl outline:1px|solid|subtle surface:base">
            <div className="flex flex-col p:2xl">
                <h3 className="mx:0 mb:0 font:2xl text:strong">
                    {t(row.title)}
                </h3>
                <p className="max-w:64ch mx:0 mb:0 mt:sm text:sm text:muted">{t(row.body)}</p>
            </div>

            <P3PalettePreview />
        </article>
    )
}

function P3PalettePreview() {
    return (
        <div
            aria-label="P3 palette tiers from 100 through 0"
            className="rel overflow:hidden mx:calc(var(--spacing-sm)+1px) mb:calc(var(--spacing-sm)+1px) mt:auto r:xl outline:1px|solid|subtle bg:surface-muted"
            role="img">
            <div aria-hidden="true" className="abs inset:0 opacity:.8 pointer-events:none" style={p3PaletteDotGridStyle} />

            <div aria-hidden="true" className="rel z:1 px:calc(var(--spacing-xl)+1px) py:calc(var(--spacing-xl)+1px) pointer-events:none" style={p3PaletteCanvasStyle}>
                <div className="grid gap:2xs" style={p3PaletteGridStyle}>
                    <span />
                    {p3PaletteColorNames.map((colorName) => (
                        <span
                            className="flex overflow:hidden items-center justify-center min-w:0 px:1px font:2xs font:mono leading:1 text-ellipsis white-space:nowrap text:muted opacity:.72"
                            key={`label-${colorName}`}>
                            {colorName}
                        </span>
                    ))}
                    {p3PaletteTiers.map((tier) => (
                        <Fragment key={tier}>
                            <div className="flex items-center justify-end tabular-nums font:2xs font:mono leading:1 text:muted opacity:.72">
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
