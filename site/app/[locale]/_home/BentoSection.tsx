import clsx from 'clsx'
import { MotionSection } from './HomeMotion'
import { bentoRows, homeSections, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type BentoRowContent, type Translate } from './home-content'

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

                <div className="mx:-md mt:10x p:md r:lg surface:muted">
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
    return (
        <div className={clsx('grid gap:md', row.gridClassName)}>
            {Array.from({ length: row.gridCount }, (_, index) => (
                <article className="flex flex-col min-h:68x p:md b:1px|solid|subtle r:md surface:base" key={index}>
                    <h3 className="mx:0 mb:0 font-weight:560 font:xl text:strong">
                        {t(row.title)}{row.gridCount > 1 && ` ${index + 1}`}
                    </h3>
                    <p className="mx:0 mb:0 mt:sm leading:1.65 text:muted">{t(row.body)}</p>
                    <div className="h:28x mt:auto b:1px|solid|subtle r:sm bg:surface-muted" />
                </article>
            ))}
        </div>
    )
}
