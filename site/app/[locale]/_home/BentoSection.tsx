import { Fragment } from 'react'
import clsx from 'clsx'
import { getColor } from '~/internal/data/color-palette'
import { MotionSection } from './HomeMotion'
import { bentoRows, homeSections, p3PaletteColorNames, p3PaletteTiers, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type BentoRowContent, type Translate } from './home-content'

const p3PaletteGridStyle = {
    gridTemplateColumns: `3.25rem repeat(${p3PaletteColorNames.length}, minmax(2.75rem, 1fr))`,
    gridAutoRows: 'clamp(2.2rem, 3.4vw, 2.45rem)'
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

                <div className="mx:-md mt:10x p:md r:3xl surface:muted">
                    <div className="grid gap:md">
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
            <div className={clsx('grid gap:md', row.gridClassName)}>
                <P3PaletteCard row={row} t={t} />
            </div>
        )
    }

    return (
        <div className={clsx('grid gap:md', row.gridClassName)}>
            {Array.from({ length: row.gridCount }, (_, index) => (
                <article className="flex flex-col b:1px|solid|subtle r:xl surface:base" key={index}>
                    <div className="flex flex-col p:2xl">
                        <h3 className="mx:0 mb:0 font:2xl text:strong">
                            {t(row.title)}{row.gridCount > 1 && ` ${index + 1}`}
                        </h3>
                        <p className="max-w:48ch mx:0 mb:0 mt:sm text:sm text:muted">{t(row.body)}</p>
                    </div>
                    <div className="h:28x mt:auto b:1px|solid|subtle r:lg bg:surface-muted" />
                </article>
            ))}
        </div>
    )
}

function P3PaletteCard({ t, row }: { t: Translate; row: BentoRowContent }) {
    return (
        <article className="flex flex-col b:1px|solid|subtle r:xl surface:base">
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
            className="rel overflow:hidden mx:sm mb:sm mt:auto r:lg outline:1px|solid|subtle bg:surface-muted"
            role="img">
            <div aria-hidden="true" className="abs inset:0 opacity:.8 pointer-events:none" style={p3PaletteDotGridStyle} />

            <div aria-hidden="true" className="rel z:1 px:xl py:xl pointer-events:none" style={p3PaletteCanvasStyle}>
                <div className="grid gap:xs" style={p3PaletteGridStyle}>
                    {p3PaletteTiers.map((tier) => (
                        <Fragment key={tier}>
                            <div className="flex items-center pr:sm tabular-nums font:mono font:sm text:muted">
                                {tier}
                            </div>
                            {p3PaletteColorNames.map((colorName) => (
                                <span
                                    className="block size:full b:1px|solid|subtle r:md"
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
