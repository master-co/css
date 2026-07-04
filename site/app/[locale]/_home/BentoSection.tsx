import clsx from 'clsx'
import { MotionSection } from './HomeMotion'
import { bentoTiles, homeSections, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type BentoTileContent, type Translate } from './home-content'

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

                <div className="mt:10x p:md r:lg surface:muted">
                    <div className="grid-cols:1 gap:md grid-cols:3@lg">
                        {bentoTiles.map((tile) => (
                            <BentoTile key={tile.title} tile={tile} t={t} />
                        ))}
                    </div>
                </div>
            </div>
        </MotionSection>
    )
}

function BentoTile({ t, tile }: { t: Translate; tile: BentoTileContent }) {
    return (
        <article className="flex flex-col min-h:68x p:md b:1px|solid|subtle r:md surface:base">
            <h3 className="mx:0 mb:0 font-weight:560 font:xl text:strong">{t(tile.title)}</h3>
            <p className="mx:0 mb:0 mt:sm leading:1.65 text:muted">{t(tile.body)}</p>
            <div className={clsx('grid gap:sm mt:auto pt:lg', tile.previewClassName)}>
                {Array.from({ length: tile.blockCount }, (_, index) => (
                    <div className="min-h:24x b:1px|solid|subtle r:sm bg:surface-muted" key={index} />
                ))}
            </div>
        </article>
    )
}
