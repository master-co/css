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

const manifestSuggestionIconNodes = {
    scope: {
        name: 'IconPalette',
        paths: [
            'M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25',
            'M7.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
            'M11.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
            'M15.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0'
        ]
    },
    screen: {
        name: 'IconDeviceDesktop',
        paths: [
            'M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10',
            'M7 20h10',
            'M9 16v4',
            'M15 16v4'
        ]
    }
} as const

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
                        createManifestSuggestionsIconElement(item.icon),
                        createManifestSuggestionsTextElement('span', 'home-manifest-suggestions__item-label', item.label),
                        createManifestSuggestionsTextElement('span', 'home-manifest-suggestions__item-detail', 'detail' in item ? item.detail : '')
                    ]
                }))
            }
        ]
    }
}

function createManifestSuggestionsIconElement(iconName: keyof typeof manifestSuggestionIconNodes) {
    return {
        type: 'element',
        tagName: 'svg',
        properties: {
            class: `home-manifest-suggestions__item-icon home-manifest-suggestions__item-icon-${iconName}`,
            'data-tabler-icon': manifestSuggestionIconNodes[iconName].name,
            fill: 'none',
            stroke: 'currentColor',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': 2,
            viewBox: '0 0 24 24'
        },
        children: manifestSuggestionIconNodes[iconName].paths.map((d) => ({
            type: 'element',
            tagName: 'path',
            properties: { d },
            children: []
        }))
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
