import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import { MotionSection } from './HomeMotion'
import { homeSections, languageServiceCards, type LanguageServiceCardContent, type Translate } from './home-content'

const activeSyntaxHighlightingCode = `
<section class="grid gap:lg p:lg r:3xl surface:raised">
  <h2 class="m:0 text:2xl text:3xl@md text:strong">Readable classes</h2>
  <p class="m:0 text:muted line-clamp:2">Hover a class to inspect CSS.</p>
  <button class="inline-flex items-center gap:xs fg:blue-60:hover">
    Open guide
  </button>
</section>
`

export default function LanguageServiceSection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.languageService}
            id={homeSections.languageService}
            className="home-section">
            <div className="home-section-wrap">
                <div className="home-section-copy">
                    <p className="home-section-label">{t('Language Service')}</p>
                    <h2 className="home-section-heading">
                        {t('Readable, and still human.')}
                    </h2>
                    <p className="home-section-body">
                        {t('Manifest-aware completions, hover previews, semantic highlighting, and workspace manifests make compact class strings readable inside the editor.')}
                    </p>
                </div>

                <HomeBentoFrame>
                    <HomeBentoGrid className="grid-cols:1 grid-cols:2@md">
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
            <div className="home-bento-card-header">
                <h3 className="home-bento-card-title">
                    {t(card.title)}
                </h3>
                <p className="home-bento-card-body">{t(card.body)}</p>
            </div>

            {card.visual === 'active-syntax-highlighting' ? (
                <ActiveSyntaxHighlightingPreview />
            ) : (
                <div className="home-bento-visual h:28x" />
            )}
        </HomeBentoCard>
    )
}

function ActiveSyntaxHighlightingPreview() {
    return (
        <HomeCodeWindow
            className="home-active-syntax home-bento-visual h:3xs"
            lang="html"
            preClassName="h:full"
            variant="embedded">
            {activeSyntaxHighlightingCode}
        </HomeCodeWindow>
    )
}
