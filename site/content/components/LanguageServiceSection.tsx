import './editor-tiles.css'
import type { CSSProperties } from 'react'
import { createRenderSessionSync } from '@master/css/node'
import type { MasterCSSShikiOptions } from '@master/css-language-service/shiki'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import preset from '~/site/utils/preset-manifest'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import { activeSyntaxHighlightingCode, colorToolClasses, homeSections, hoverInspectionClass, hoverInspectionLines, languageServiceCards, manifestSuggestionItems, manifestSuggestionsCode, manifestSuggestionsPrefix, manifestSuggestionsTyped, type LanguageServiceCardContent } from './home-content'

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

const languageServiceGridClassNames = {
  'hover-inspection': 'grid-col-span(7)@lg',
  'manifest-aware-suggestions': 'grid-col-span(5)@lg',
  'active-syntax-highlighting': 'grid-col-span(5)@lg',
  'color-tools': 'grid-col-span(7)@lg'
} satisfies Record<LanguageServiceCardContent['visual'], string>

export default function LanguageServiceSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.languageService} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="05"
          label={$('Read')}
          title={$('Dense class strings, still readable.')}
          body={$('Completions from your manifest, generated CSS on hover, color swatches and focused highlighting.')} />
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(2)@md grid-cols(12)@lg">
            {languageServiceCards.map((card) => (
              <HomeBentoCard className={clsx('home-reveal-item', languageServiceGridClassNames[card.visual])} key={card.title} title={$(card.title)} body={$(card.body)}>
                {card.visual === 'hover-inspection' && <HoverInspectionPreview />}
                {card.visual === 'color-tools' && <ColorToolsPreview />}
                {card.visual === 'manifest-aware-suggestions' && (
                  <div aria-hidden="true" className="home-bento-visual home-manifest-suggestions">
                    <HomeCodeWindow className="home-manifest-suggestions-window" lang="html" masterCSS={manifestSuggestionsShikiOptions} preClassName="height:100%" variant="embedded">
                      {manifestSuggestionsCode}
                    </HomeCodeWindow>
                  </div>
                )}
                {card.visual === 'active-syntax-highlighting' && (
                  <HomeCodeWindow className="h-2xs home-active-syntax home-bento-visual" lang="html" preClassName="height:100%" variant="embedded">
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

/** A pointer hovers a class and the editor shows the CSS it generates. */
function HoverInspectionPreview() {
  const $ = useTranslation()
  const engine = createRenderSessionSync({ manifest: preset })
  let css: string
  try {
    css = formatRule(engine.ensureClassRules([hoverInspectionClass]).classRules[hoverInspectionClass][0].text)
  } finally {
    engine.dispose()
  }
  const [first, hovered, last] = hoverInspectionLines
  const tokenStart = hovered.indexOf(hoverInspectionClass)
  return (
    <div aria-hidden="true" className="home-bento-visual home-hover-inspection" style={{ '--home-token-start': `${tokenStart}ch`, '--home-token-length': `${hoverInspectionClass.length}ch` } as CSSProperties}>
      <div className="home-code-window-chrome">
        <span className="home-code-window-dot" />
        <span className="home-code-window-dot" />
        <span className="home-code-window-dot" />
      </div>
      <div className="home-hover-code">
        <MarkupLine line={first} />
        <MarkupLine line={hovered} />
        <MarkupLine line={last} />
        <span className="home-hover-token" />
        <div className="home-hover-card">
          <p className="home-hover-card-title">{$('Generated CSS')}</p>
          <pre className="home-hover-card-css">{css}</pre>
        </div>
        <svg className="home-hover-cursor" viewBox="0 0 24 24" width="22" height="22">
          <path d="M5 3l14 7.5-6.2 1.6L10 18.5z" />
        </svg>
      </div>
    </div>
  )
}

/** Swatches beside color classes, with the color picker opening on the first. */
function ColorToolsPreview() {
  return (
    <div aria-hidden="true" className="home-bento-visual home-color-tools">
      <div className="home-code-window-chrome">
        <span className="home-code-window-dot" />
        <span className="home-code-window-dot" />
        <span className="home-code-window-dot" />
      </div>
      <div className="home-color-tools-body">
        <div className="home-color-tools-lines">
          {colorToolClasses.map((item) => (
            <div className="home-color-tools-line" key={item.className}>
              <span className="home-code-tag">&lt;span</span> <span className="home-code-attr">class</span>=<span className="home-code-string">&quot;</span>
              <span className="home-code-string">{item.className.slice(0, item.swatchAt)}</span>
              <span className="home-color-swatch" style={{ background: item.color }} />
              <span className="home-code-string">{item.className.slice(item.swatchAt)}&quot;</span><span className="home-code-tag">&gt;</span>
            </div>
          ))}
        </div>
        <div className="home-color-picker">
          <div className="home-color-picker-plane" style={{ '--home-picker-color': colorToolClasses[0].color } as CSSProperties}>
            <span className="home-color-picker-handle" />
          </div>
          <div className="home-color-picker-hue">
            <span className="home-color-picker-hue-handle" />
          </div>
          <code className="home-color-picker-value">{colorToolClasses[0].color}</code>
        </div>
      </div>
    </div>
  )
}

/** Markup highlighted by hand, so the hover overlay can align to its characters. */
function MarkupLine({ line }: { line: string }) {
  const match = line.match(/^(\s*)<(\w+) class="([^"]*)">(.*)$/)
  if (!match) return <div className="home-hover-line"><span className="home-code-tag">{line}</span></div>
  const closing = match[4].match(/<\/\w+>$/)?.[0]
  return (
    <div className="home-hover-line">
      {match[1]}<span className="home-code-tag">&lt;{match[2]}</span> <span className="home-code-attr">class</span>=<span className="home-code-string">&quot;{match[3]}&quot;</span><span className="home-code-tag">&gt;</span>{closing ? match[4].slice(0, -closing.length) : match[4]}{closing && <span className="home-code-tag">{closing}</span>}
    </div>
  )
}

/** Indent a generated rule such as `@media (…){.a{color:red}}` for display. */
function formatRule(text: string) {
  const at = text.match(/^(@[^{]+)\{(.*)\}$/)
  const rule = at ? at[2] : text
  const [, selector, body] = rule.match(/^([^{]+)\{([^}]*)\}$/)!
  const indent = at ? '  ' : ''
  const declarations = body.split(';').filter(Boolean).map((declaration) => {
    const index = declaration.indexOf(':')
    return `${indent}  ${declaration.slice(0, index)}: ${declaration.slice(index + 1)};`
  })
  const lines = [`${indent}${selector} {`, ...declarations, `${indent}}`]
  return at ? [`${at[1].trim()} {`, ...lines, '}'].join('\n') : lines.join('\n')
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
