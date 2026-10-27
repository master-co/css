import type { MasterCSSShikiOptions } from '@master/css-language-service/shiki'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import { activeSyntaxHighlightingCode, homeSections, languageServiceCards, manifestSuggestionItems, manifestSuggestionsCode, manifestSuggestionsPrefix, manifestSuggestionsTyped } from './home-content'

type HastNode = HastText | HastElement

interface HastText {
  type: 'text'
  value: string
}

interface HastElement {
  type: 'element'
  tagName: string
  properties: Record<string, unknown>
  children: HastNode[]
}

/** Tabler's palette icon, inlined because the menu is assembled as highlighted-code HAST. */
const paletteIconPaths = [
  'M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25',
  'M7.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  'M11.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  'M15.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0'
]

const manifestSuggestionsShikiOptions = {
  classAttributeValueWrapper: {
    properties: {
      class: 'home-manifest-suggestions-class-value',
      style: `--home-manifest-suggestions-prefix:${manifestSuggestionsPrefix.length}ch;--home-manifest-suggestions-typed:${manifestSuggestionsTyped.length}ch`
    },
    transform(node, type) {
      if (type !== 'wrapper') return
      const wrapper = node as HastElement
      // The animation types the token key after the prefix, then opens the completion menu.
      const [prefix, typed] = splitNodes(wrapper.children, manifestSuggestionsPrefix.length)
      wrapper.children = [...prefix, element('span', 'home-manifest-suggestions-typed', typed), createSuggestionsMenu()]
      return wrapper
    }
  }
} satisfies MasterCSSShikiOptions

export default function LanguageServiceSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.languageService} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          label={$('Language Service')}
          title={$('Readable, and still human.')}
          body={$('Manifest-aware completions, hover previews, semantic highlighting, and workspace manifests make compact class strings readable inside the editor.')} />
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(2)@md">
            {languageServiceCards.map((card) => (
              <HomeBentoCard key={card.title} title={$(card.title)} body={$(card.body)}>
                {card.visual === 'manifest-aware-suggestions' ? (
                  <div aria-hidden="true" className="home-bento-visual home-manifest-suggestions">
                    <HomeCodeWindow className="home-manifest-suggestions-window" lang="html" masterCSS={manifestSuggestionsShikiOptions} preClassName="height:100%" variant="embedded">
                      {manifestSuggestionsCode}
                    </HomeCodeWindow>
                  </div>
                ) : (
                  <HomeCodeWindow className="h-3xs home-active-syntax home-bento-visual" lang="html" preClassName="height:100%" variant="embedded">
                    {activeSyntaxHighlightingCode}
                  </HomeCodeWindow>
                )}
              </HomeBentoCard>
            ))}
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}

function element(tagName: string, className: string | undefined, children: HastNode[], properties: Record<string, unknown> = {}): HastElement {
  return { type: 'element', tagName, properties: className ? { class: className, ...properties } : properties, children }
}

function text(value: string): HastText {
  return { type: 'text', value }
}

function textLength(node: HastNode): number {
  return node.type === 'text' ? node.value.length : node.children.reduce((length, child) => length + textLength(child), 0)
}

/** Split nodes at a text offset, cloning any element that straddles it. */
function splitNodes(nodes: HastNode[], index: number): [HastNode[], HastNode[]] {
  const before: HastNode[] = []
  const after: HastNode[] = []
  let offset = 0
  for (const node of nodes) {
    const length = textLength(node)
    if (offset + length <= index) {
      before.push(node)
    } else if (offset >= index) {
      after.push(node)
    } else if (node.type === 'text') {
      before.push(text(node.value.slice(0, index - offset)))
      after.push(text(node.value.slice(index - offset)))
    } else {
      const [left, right] = splitNodes(node.children, index - offset)
      before.push({ ...node, children: left })
      after.push({ ...node, children: right })
    }
    offset += length
  }
  return [before, after]
}

function createSuggestionsMenu() {
  const icon = element('svg', 'home-manifest-suggestions-item-icon', paletteIconPaths.map((d) => element('path', undefined, [], { d })), {
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': 2,
    viewBox: '0 0 24 24'
  })
  return element('span', 'home-manifest-suggestions-menu', [
    element('span', 'home-manifest-suggestions-items', manifestSuggestionItems.map((item, index) => element(
      'span',
      index === 0 ? 'home-manifest-suggestions-item home-manifest-suggestions-item-active' : 'home-manifest-suggestions-item',
      [
        icon,
        element('span', 'home-manifest-suggestions-item-label', [text(item.label)]),
        element('span', 'home-manifest-suggestions-item-detail', 'detail' in item ? [text(item.detail)] : [])
      ]
    )))
  ])
}
