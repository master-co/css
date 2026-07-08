import clsx from 'clsx'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, homeBentoCardBodyClassName, homeBentoCardHeaderClassName, homeBentoCardTitleClassName, homeBentoVisualClassName } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import { MotionSection } from './HomeMotion'
import { homeSections, languageServiceCards, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type LanguageServiceCardContent, type Translate } from './home-content'

const activeSyntaxHighlightingCode = `
<section class="grid gap:lg p:lg r:3xl surface:raised">
  <h2 class="m:0 text:2xl text:3xl@md text:strong">Readable classes</h2>
  <p class="m:0 text:muted line-clamp:2">Hover a class to inspect CSS.</p>
  <button class="inline-flex items-center gap:xs fg:blue-60:hover">
    Open guide
  </button>
</section>
`

const activeSyntaxHighlightingStyle = `
.home-active-syntax .code-wrapper {
    height: 100%;
}

.home-active-syntax {
    --home-active-syntax-cycle: 8s;
}

.home-active-syntax .mcss-semantic {
    animation: home-active-syntax-token var(--home-active-syntax-cycle) steps(1, end) infinite;
    animation-delay: var(--home-active-syntax-delay, 0s);
    position: relative;
}

.home-active-syntax .line .mcss-semantic::before {
    animation: home-active-syntax-caret-window var(--home-active-syntax-cycle) steps(1, end) infinite, home-active-syntax-caret-blink 1s steps(1, end) infinite;
    animation-delay: var(--home-active-syntax-delay, 0s), 0s;
    background: var(--color-yellow);
    content: '';
    display: block;
    height: 1.05em;
    left: -2px;
    opacity: 0;
    position: absolute;
    top: 0.08em;
    visibility: hidden;
    width: 1px;
}

.home-active-syntax .line .mcss-semantic ~ .mcss-semantic::before {
    content: none;
}

.home-active-syntax .line:nth-child(1) .mcss-semantic,
.home-active-syntax .line:nth-child(1) .mcss-semantic::before {
    --home-active-syntax-delay: 0s;
}

.home-active-syntax .line:nth-child(2) .mcss-semantic,
.home-active-syntax .line:nth-child(2) .mcss-semantic::before {
    --home-active-syntax-delay: -6s;
}

.home-active-syntax .line:nth-child(3) .mcss-semantic,
.home-active-syntax .line:nth-child(3) .mcss-semantic::before {
    --home-active-syntax-delay: -4s;
}

.home-active-syntax .line:nth-child(4) .mcss-semantic,
.home-active-syntax .line:nth-child(4) .mcss-semantic::before {
    --home-active-syntax-delay: -2s;
}

@keyframes home-active-syntax-token {
    25%, 100% {
        color: currentColor;
    }
}

@keyframes home-active-syntax-caret-window {
    0%, 24.9% {
        visibility: visible;
    }

    25%, 100% {
        visibility: hidden;
    }
}

@keyframes home-active-syntax-caret-blink {
    0%, 49% {
        opacity: 1;
    }

    50%, 100% {
        opacity: 0;
    }
}
`

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
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(card.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(card.body)}</p>
            </div>

            {card.visual === 'active-syntax-highlighting' ? (
                <ActiveSyntaxHighlightingPreview />
            ) : (
                <div className={clsx(homeBentoVisualClassName, 'h:28x')} />
            )}
        </HomeBentoCard>
    )
}

function ActiveSyntaxHighlightingPreview() {
    return (
        <>
            <style>{activeSyntaxHighlightingStyle}</style>
            <HomeCodeWindow
                className={clsx(homeBentoVisualClassName, 'h:3xs home-active-syntax')}
                lang="html"
                preClassName="h:full"
                variant="embedded">
                {activeSyntaxHighlightingCode}
            </HomeCodeWindow>
        </>
    )
}
