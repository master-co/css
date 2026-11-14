import { chromium } from '@playwright/test'
import postcss, { type Container, type Root } from 'postcss'
import selectorParser from 'postcss-selector-parser'

export type SelectorUsage = {
  styleRules: number
  matchedStyleRules: number
  ruleBytes: number
  matchedRuleBytes: number
  tokenRules: number
  domElements: number
}

type StyleRule = {
  selectors: string[]
  bytes: number
  tokenOnly: boolean
}

export const selectorUsageViewport = { width: 1280, height: 800 }

// State pseudo-classes and pseudo-elements are removed before matching, so `.tab:hover` or `.card::before`
// counts when a `.tab` or `.card` exists. Chromium's own CSS coverage cannot answer this question: it
// reports a whole `@layer` block as used once any rule inside it matches.
const statePseudo = /::?(?:-[a-z]+-)?(?:hover|focus|focus-visible|focus-within|active|visited|link|any-link|target|target-within|checked|indeterminate|disabled|enabled|invalid|valid|user-invalid|user-valid|placeholder-shown|autofill|open|closed|modal|popover-open|fullscreen|playing|paused|default|required|optional|read-only|read-write|in-range|out-of-range|empty|blank|defined|current|past|future|before|after|marker|placeholder|selection|backdrop|file-selector-button|first-line|first-letter|cue|part\([^)]*\)|slotted\([^)]*\)|highlight\([^)]*\)|view-transition[a-z-]*(?:\([^)]*\))?|scrollbar[a-z-]*|search-cancel-button|inner-spin-button|outer-spin-button|details-content|picker\([^)]*\)|picker-icon|checkmark|column|scroll-marker[a-z-]*|scroll-button\([^)]*\)|moz-[a-z-]+|webkit-[a-z-]+|ms-[a-z-]+)(?![\w-])/g

export function collectStyleRules(cssTexts: string[]): StyleRule[] {
  const rules: StyleRule[] = []
  for (const text of cssTexts) {
    let root: Root
    try {
      root = postcss.parse(text)
    } catch {
      continue
    }
    visitRules(root, '', false, rules)
  }
  return rules
}

function visitRules(container: Container, parentSelector: string, insideKeyframes: boolean, rules: StyleRule[]) {
  for (const child of container.nodes ?? []) {
    if (child.type === 'atrule') {
      if (child.nodes) visitRules(child, parentSelector, insideKeyframes || /keyframes$/.test(child.name), rules)
      continue
    }
    if (child.type !== 'rule' || insideKeyframes) continue
    let selector = generateSelector(child.selector)
    if (parentSelector) {
      selector = splitSelectorList(selector)
        .map((part) => part.includes('&') ? part.replaceAll('&', `:is(${parentSelector})`) : `:is(${parentSelector}) ${part}`)
        .join(',')
    }
    let declarations = 0
    let customProperties = 0
    for (const item of child.nodes) {
      if (item.type !== 'decl') continue
      if (item.prop.startsWith('--')) customProperties++
      else declarations++
    }
    if (declarations || customProperties) {
      rules.push({
        selectors: splitSelectorList(selector).map(normalizeSelector),
        bytes: child.source!.end!.offset - child.source!.start!.offset,
        tokenOnly: declarations === 0
      })
    }
    visitRules(child, selector, false, rules)
  }
}

/** Prints a selector compactly: no comments, no whitespace around commas or explicit combinators. */
function generateSelector(selector: string) {
  try {
    const root = selectorParser().astSync(selector)
    root.walk((node) => {
      if (node.type === 'comment') {
        node.remove()
        return
      }
      node.spaces.before = ''
      node.spaces.after = ''
      if (node.type === 'combinator') {
        node.rawSpaceBefore = ''
        node.rawSpaceAfter = ''
        node.value = node.value.trim() || ' '
        if (node.raws) delete node.raws.value
      } else if (node.type === 'attribute') {
        // The printer keeps the one space an unquoted value needs before its flag.
        for (const spaces of [node.spaces, node.raws.spaces]) {
          for (const part of Object.values(spaces ?? {})) {
            if (typeof part === 'object') Object.assign(part, { before: '', after: '' })
          }
        }
      }
    })
    return root.toString()
  } catch {
    return selector
  }
}

function splitSelectorList(selector: string) {
  return selector.split(/,(?![^(]*\))/)
}

function normalizeSelector(selector: string) {
  return selector.replace(statePseudo, '').replace(/:(?:is|where|not)\(\s*\)/g, '').trim() || '*'
}

/** Tests every delivered style rule's selectors against the DOM of each loaded page. */
export async function measureSelectorUsage(pages: { url: string, cssTexts: string[] }[]): Promise<SelectorUsage[]> {
  const browser = await chromium.launch()
  try {
    const results: SelectorUsage[] = []
    for (const target of pages) {
      const context = await browser.newContext({ viewport: selectorUsageViewport, deviceScaleFactor: 1, colorScheme: 'light' })
      try {
        const page = await context.newPage()
        await page.goto(target.url, { waitUntil: 'networkidle', timeout: 60_000 })
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 700) {
            window.scrollTo(0, y)
            await new Promise((resolve) => setTimeout(resolve, 50))
          }
          window.scrollTo(0, 0)
        })
        await page.waitForTimeout(500)
        const rules = collectStyleRules(target.cssTexts)
        const candidates = [...new Set(rules.filter((rule) => !rule.tokenOnly).flatMap((rule) => rule.selectors))]
        const matches = await page.evaluate((selectors) => {
          const matched: Record<string, boolean> = {}
          for (const selector of selectors) {
            try {
              matched[selector] = document.querySelector(selector) !== null
            } catch {
              matched[selector] = false
            }
          }
          return { matched, domElements: document.querySelectorAll('*').length }
        }, candidates)
        const usage: SelectorUsage = { styleRules: 0, matchedStyleRules: 0, ruleBytes: 0, matchedRuleBytes: 0, tokenRules: 0, domElements: matches.domElements }
        for (const rule of rules) {
          if (rule.tokenOnly) {
            usage.tokenRules++
            continue
          }
          usage.styleRules++
          usage.ruleBytes += rule.bytes
          if (rule.selectors.some((selector) => matches.matched[selector])) {
            usage.matchedStyleRules++
            usage.matchedRuleBytes += rule.bytes
          }
        }
        results.push(usage)
      } finally {
        await context.close()
      }
    }
    return results
  } finally {
    await browser.close()
  }
}
