import clsx from 'clsx'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, homeBentoCardBodyClassName, homeBentoCardHeaderClassName, homeBentoCardTitleClassName, homeBentoVisualClassName } from './HomeBento'
import { MotionSection } from './HomeMotion'
import { homeSections, languageServiceCards, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type LanguageServiceCardContent, type Translate } from './home-content'

export default function LanguageServiceSection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.languageService}
            id={homeSections.languageService}
            className="py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <p className={sectionLabelClassName}>{t('Language Service')}</p>
                    <h2 className={sectionHeadingClassName}>
                        {t('Readable, and still human.')}
                    </h2>
                    <p className={sectionBodyClassName}>
                        {t('Manifest-aware completions, hover previews, semantic highlighting, color tools, and directive formatting make compact class strings readable inside the editor.')}
                    </p>
                </div>

                <HomeBentoFrame>
                    <HomeBentoGrid className="grid-cols:1 grid-cols:2@md grid-cols:3@lg">
                        {languageServiceCards.map((card) => (
                            <LanguageServiceCard card={card} key={card.title} t={t} />
                        ))}
                    </HomeBentoGrid>
                </HomeBentoFrame>
            </div>
        </MotionSection>
    )
}

function LanguageServiceCard({ card, t }: { card: LanguageServiceCardContent; t: Translate }) {
    return (
        <HomeBentoCard>
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(card.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(card.body)}</p>
            </div>

            <div className={clsx(homeBentoVisualClassName, 'h:28x')} />
        </HomeBentoCard>
    )
}
