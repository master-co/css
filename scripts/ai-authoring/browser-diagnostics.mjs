import { compileCSSSync } from '@master/css-compiler/node'
import { createToolingSessionSync } from '@master/css-tooling/node'

// Browser evidence is deliberately separate from Rust utility semantics. Matched
// rules are candidates, not a JavaScript implementation of the CSS cascade.
export async function inspectPageClasses(page, manifest) {
  const elements = await page.locator('[class]').evaluateAll(elements => elements.map(el => {
    const path = []
    for (let node = el; node; node = node.parentElement) {
      path.unshift(`${node.localName}:nth-child(${Array.from(node.parentElement?.children ?? [node]).indexOf(node) + 1})`)
    }
    return { selector: path.join(' > '), id: el.id || null, classes: [...el.classList] }
  }))
  const native = new Set(manifest.nativeClassNames ?? [])
  const styles = await page.locator('style').evaluateAll(elements => elements.filter(el => el.sheet).map(el => el.textContent || ''))
  for (const css of styles) for (const name of compileCSSSync(css).nativeClassNames) native.add(name)
  using tooling = createToolingSessionSync({ manifest: manifest.manifest })
  const classes = [...new Set(elements.flatMap(el => el.classes))].map(className => {
    const inspection = tooling.inspectClassName(className)
    const status = inspection.matchStatus === 'matched' ? 'generated' : native.has(className) ? 'native-css' : 'unresolved'
    return {
      className, status, matchStatus: inspection.matchStatus,
      occurrences: elements.filter(el => el.classes.includes(className)).map(({ selector, id }) => ({ selector, id })),
      diagnostics: inspection.diagnostics,
      ...(status === 'unresolved' ? { nextStep: 'Check this spelling against the project manifest with inspect or suggest; also check whether it is an intentional script hook or external native class.' } : {})
    }
  })
  return { classes, unresolved: classes.filter(item => item.status === 'unresolved'), coverage: 'Project native definitions and browser-recognized inline style definitions; external unmanaged styles and script hooks may remain unresolved. Recognition does not establish an active rule.' }
}

export async function captureStyleEvidence(page, selector, properties, index = 0) {
  const session = await page.context().newCDPSession(page)
  const sheets = new Map()
  session.on('CSS.styleSheetAdded', ({ header }) => sheets.set(header.styleSheetId, header))
  try {
    await session.send('DOM.enable')
    await session.send('CSS.enable')
    const { root } = await session.send('DOM.getDocument')
    const { nodeIds } = await session.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector })
    if (!nodeIds[index]) return { status: 'missing-element', selector, index }
    const nodeId = nodeIds[index]
    const matched = await session.send('CSS.getMatchedStylesForNode', { nodeId })
    const layers = await session.send('CSS.getLayersForNode', { nodeId })
    const propertyNames = new Set(properties)
    const compactStyle = (style, rule, matchingSelectors, fallbackSelector = 'element.style') => {
      if (!style) return null
      const declarations = style.cssProperties.filter(prop => propertyNames.has(prop.name) || prop.name === 'all' || prop.longhandProperties?.some(longhand => propertyNames.has(longhand.name)))
      if (!declarations.length) return null
      const header = sheets.get(rule?.styleSheetId ?? style.styleSheetId)
      const position = range => range ? {
        url: header?.sourceURL || page.url(),
        line: (header?.startLine ?? 0) + range.startLine + 1,
        column: (range.startLine === 0 ? header?.startColumn ?? 0 : 0) + range.startColumn + 1
      } : null
      return {
        selector: rule?.selectorList.text ?? fallbackSelector,
        matchingSelectors: matchingSelectors?.map(i => rule.selectorList.selectors[i]?.text),
        origin: rule?.origin ?? 'inline',
        source: header?.sourceURL || (rule?.origin === 'user-agent' ? null : page.url()),
        layers: rule?.layers?.map(layer => layer.text) ?? [],
        media: rule?.media?.map(media => ({ text: media.text, active: media.mediaList?.map(item => item.active) })) ?? [],
        supports: rule?.supports?.map(item => ({ text: item.text, active: item.active })) ?? [],
        scopes: rule?.scopes?.map(item => item.text) ?? [],
        containerQueries: rule?.containerQueries?.map(item => item.text) ?? [],
        declarations: declarations.map(prop => ({
          name: prop.name, value: prop.value, important: Boolean(prop.important),
          parsed: prop.parsedOk !== false, disabled: Boolean(prop.disabled), implicit: Boolean(prop.implicit),
          location: position(prop.range), authored: Boolean(prop.range),
          longhands: prop.longhandProperties?.filter(item => propertyNames.has(item.name)).map(({ name, value }) => ({ name, value }))
        }))
      }
    }
    const rules = entry => [
      compactStyle(entry.inlineStyle),
      compactStyle(entry.attributesStyle, undefined, undefined, 'presentation attributes'),
      ...(entry.matchedCSSRules ?? []).map(({ rule, matchingSelectors }) => compactStyle(rule.style, rule, matchingSelectors))
    ].filter(Boolean)
    const direct = rules(matched)
    const inherited = (matched.inherited ?? []).slice(0, 16).map(rules)
    const variables = [...new Set([...direct, ...inherited.flat()].flatMap(rule => rule.declarations.flatMap(prop => [...prop.value.matchAll(/var\(\s*(--[\w-]+)/g)].map(match => match[1]))))].slice(0, 16)
    const chain = await page.locator(selector).nth(index).evaluate((element, { properties, variables }) => {
      const result = []
      for (let el = element; el && result.length < 17; el = el.parentElement) {
        const css = getComputedStyle(el)
        result.push({
          tag: el.localName, id: el.id || null, classes: [...el.classList],
          values: Object.fromEntries(properties.map(name => [name, css.getPropertyValue(name)])),
          variables: Object.fromEntries(variables.map(name => [name, css.getPropertyValue(name)])),
          animations: el.getAnimations().map(animation => ({ playState: animation.playState, currentTime: animation.currentTime, type: animation.constructor.name }))
        })
      }
      return result
    }, { properties, variables })
    return {
      status: 'captured', selector, index, element: chain[0], rules: direct,
      ancestors: chain.slice(1).map((element, i) => ({ element, rules: inherited[i] ?? [] })),
      layerOrder: layers.rootLayer,
      limits: 'Computed values are browser observations. Rules are matched candidates, not proven winners; ancestor declarations do not prove inheritance. Revert, variables, animations, layout and other dependencies can determine the value. No styles are edited. Ancestors and directly referenced variables are capped at 16; transitive variable provenance, pseudo-elements, frames and shadow trees are not traced.'
    }
  } finally { await session.detach() }
}

export async function applyDiagnosticState(page, state, selector) {
  if (state === 'hover') await page.locator(selector).hover()
  else if (state === 'focus') {
    // Keyboard focus, rather than forced :focus-visible, preserves browser behavior.
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press('Tab')
      if (await page.locator(selector).evaluate(el => el === document.activeElement)) return
    }
    throw new Error(`Keyboard focus did not reach ${selector}`)
  } else if (state === 'disabled') await page.locator(selector).evaluate(el => { el.disabled = true })
  else if (state !== 'rest') throw new Error(`Unsupported diagnostic state: ${state}`)
}

export async function compareStyleEvidence(browser, { source, target, selector, properties, index = 0, width = 390, colorScheme = 'light', state = 'rest', stateSelector = selector }) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme })
  try {
    const results = {}
    for (const [name, url] of Object.entries({ source, target })) {
      const page = await context.newPage()
      page.setDefaultTimeout(2000)
      await page.goto(url)
      await applyDiagnosticState(page, state, stateSelector)
      results[name] = await captureStyleEvidence(page, selector, properties, index)
      await page.close()
    }
    const differences = results.source.status === 'captured' && results.target.status === 'captured'
      ? properties.filter(name => results.source.element.values[name] !== results.target.element.values[name])
        .map(property => ({ property, source: results.source.element.values[property], target: results.target.element.values[property] }))
      : null
    return { selector, index, width, colorScheme, state, comparison: 'Computed-value serialization, not visual equivalence', differences, ...results }
  } finally { await context.close() }
}
