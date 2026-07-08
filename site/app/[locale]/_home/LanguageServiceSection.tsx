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

const manifestSuggestionsCode = `
<button class="text:amber">
  Upgrade plan
</button>
`

const manifestSuggestionItems = [
    {
        detail: '(scope) color-text-amber',
        label: 'amber',
        tone: 'amber'
    },
    {
        detail: '(theme) color-text-blue',
        label: 'blue',
        tone: 'blue'
    },
    {
        detail: '(theme) color-text-cyan',
        label: 'cyan',
        tone: 'cyan'
    },
    {
        detail: '(semantic) text-body',
        label: 'body',
        tone: 'neutral'
    },
    {
        detail: '(semantic) text-muted',
        label: 'muted',
        tone: 'neutral'
    },
    {
        detail: '@hover selector',
        label: 'hover',
        tone: 'selector'
    },
    {
        detail: '@sm query',
        label: 'sm',
        tone: 'query'
    }
] as const

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
        <HomeBentoCard className={card.visual === 'manifest-aware-suggestions' ? 'grid-col-span:2@md' : undefined}>
            <div className="home-bento-card-header">
                <h3 className="home-bento-card-title">
                    {t(card.title)}
                </h3>
                <p className="home-bento-card-body">{t(card.body)}</p>
            </div>

            {card.visual === 'manifest-aware-suggestions' ? (
                <ManifestAwareSuggestionsPreview />
            ) : card.visual === 'active-syntax-highlighting' ? (
                <ActiveSyntaxHighlightingPreview />
            ) : (
                <div className="home-bento-visual h:28x" />
            )}
        </HomeBentoCard>
    )
}

function ManifestAwareSuggestionsPreview() {
    return (
        <div aria-hidden="true" className="home-bento-visual home-manifest-suggestions">
            <HomeCodeWindow
                className="home-manifest-suggestions__window"
                lang="html"
                preClassName="h:full"
                variant="embedded">
                {manifestSuggestionsCode}
            </HomeCodeWindow>
            <div className="home-manifest-suggestions__menu">
                <div className="home-manifest-suggestions__menu-head">
                    <span>Manifest suggestions</span>
                    <span>nearest workspace</span>
                </div>
                <div className="home-manifest-suggestions__items">
                    {manifestSuggestionItems.map((item, index) => (
                        <div
                            className={index === 0 ? 'home-manifest-suggestions__item home-manifest-suggestions__item-active' : 'home-manifest-suggestions__item'}
                            key={item.label}>
                            <span className={`home-manifest-suggestions__item-icon home-manifest-suggestions__item-icon-${item.tone}`} />
                            <span className="home-manifest-suggestions__item-label">{item.label}</span>
                            <span className="home-manifest-suggestions__item-detail">{item.detail}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
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
