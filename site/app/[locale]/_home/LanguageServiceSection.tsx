import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import { MotionSection } from './HomeMotion'
import { homeSections, languageServiceCards, type LanguageServiceCardContent, type Translate } from './home-content'
import type { MasterCSSShikiOptions } from '@master/css-language/shiki'

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
        icon: 'scope',
        label: 'amber'
    },
    {
        icon: 'scope',
        label: 'beryl'
    },
    {
        icon: 'scope',
        label: 'blue'
    },
    {
        icon: 'scope',
        label: 'body'
    },
    {
        icon: 'scope',
        label: 'brown'
    },
    {
        icon: 'scope',
        label: 'crimson'
    },
    {
        icon: 'scope',
        label: 'cyan'
    },
    {
        icon: 'scope',
        label: 'disabled'
    },
    {
        icon: 'screen',
        label: '3xs'
    },
    {
        icon: 'screen',
        label: '2xs'
    },
    {
        icon: 'screen',
        label: 'xs'
    },
    {
        icon: 'screen',
        label: 'sm'
    },
    {
        icon: 'screen',
        label: 'md'
    },
    {
        icon: 'screen',
        label: 'lg'
    }
] as const satisfies readonly { detail?: string; icon: 'scope' | 'screen'; label: string }[]

const manifestSuggestionsShikiOptions = {
    classAttributeValueWrapper: {
        properties: {
            class: 'home-manifest-suggestions__class-value'
        },
        transform(element, type) {
            if (type !== 'wrapper') return
            const wrapper = element as { children?: unknown[] }
            wrapper.children = [
                ...(wrapper.children ?? []),
                createManifestSuggestionsMenuHast()
            ]
            return wrapper
        }
    }
} satisfies MasterCSSShikiOptions

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

            {card.visual === 'manifest-aware-suggestions' ? (
                <ManifestAwareSuggestionsPreview />
            ) : (
                <ActiveSyntaxHighlightingPreview />
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
                masterCSS={manifestSuggestionsShikiOptions}
                preClassName="h:full"
                variant="embedded">
                {manifestSuggestionsCode}
            </HomeCodeWindow>
        </div>
    )
}

function ActiveSyntaxHighlightingPreview() {
    return (
        <HomeCodeWindow
            className="h:3xs home-active-syntax home-bento-visual"
            lang="html"
            preClassName="h:full"
            variant="embedded">
            {activeSyntaxHighlightingCode}
        </HomeCodeWindow>
    )
}

function createManifestSuggestionsMenuHast() {
    return {
        type: 'element',
        tagName: 'span',
        properties: {
            class: 'home-manifest-suggestions__menu'
        },
        children: [
            {
                type: 'element',
                tagName: 'span',
                properties: {
                    class: 'home-manifest-suggestions__items'
                },
                children: manifestSuggestionItems.map((item, index) => ({
                    type: 'element',
                    tagName: 'span',
                    properties: {
                        class: index === 0
                            ? 'home-manifest-suggestions__item home-manifest-suggestions__item-active'
                            : 'home-manifest-suggestions__item'
                    },
                    children: [
                        createManifestSuggestionsTextElement('span', `home-manifest-suggestions__item-icon home-manifest-suggestions__item-icon-${item.icon}`, ''),
                        createManifestSuggestionsTextElement('span', 'home-manifest-suggestions__item-label', item.label),
                        createManifestSuggestionsTextElement('span', 'home-manifest-suggestions__item-detail', 'detail' in item ? item.detail : '')
                    ]
                }))
            }
        ]
    }
}

function createManifestSuggestionsTextElement(tagName: string, className: string | undefined, value: string) {
    return {
        type: 'element',
        tagName,
        properties: className ? { class: className } : {},
        children: value ? [{ type: 'text', value }] : []
    }
}
