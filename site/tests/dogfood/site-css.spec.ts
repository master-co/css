import { expect, test, type Page } from '@playwright/test'

test('guide uses the responsive prose cascade after hydration', async ({ page }, testInfo) => {
  const failures = capturePageFailures(page)
  await page.goto('/en/guide')
  await page.locator('.prose h2').first().waitFor()

  const mobile = testInfo.project.name.startsWith('mobile')
  const styles = await page.locator('.prose h2').first().evaluate((heading, mobile) => {
    const resolveLength = (name: string) => {
      const probe = document.createElement('div')
      probe.style.width = `var(${name})`
      probe.style.position = 'absolute'
      probe.style.visibility = 'hidden'
      document.body.append(probe)
      const value = getComputedStyle(probe).width
      probe.remove()
      return value
    }
    const computed = getComputedStyle(heading)
    return {
      expectedMarginTop: resolveLength(mobile ? '--spacing-lg' : '--spacing-2xl'),
      marginTop: computed.marginTop,
      scrollMarginTop: computed.scrollMarginTop
    }
  }, mobile)

  expect(styles.marginTop).toBe(styles.expectedMarginTop)
  expect(styles.scrollMarginTop).toBe(mobile ? '60px' : '100px')

  const proseRuleText = (await readCssom(page)).text.replace(/\s/g, '')
  const baseRule = '.prose:is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-lg);scroll-margin-top:60px;'
  const responsiveRule =
    '@media(width>=52.125rem){.prose:is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-2xl);scroll-margin-top:100px;'
  expect(proseRuleText.indexOf(baseRule)).toBeGreaterThanOrEqual(0)
  expect(proseRuleText.indexOf(responsiveRule)).toBeGreaterThan(proseRuleText.indexOf(baseRule))
  await expectNoHorizontalOverflow(page)
  expect(failures).toEqual([])
})

test('introduction sidebar keeps descendant selectors and vertical flow', async ({ page }, testInfo) => {
  const failures = capturePageFailures(page)
  await page.goto('/en/guide/introduction')
  const sidebar = page.locator('#sidebar')
  await sidebar.waitFor({ state: 'attached' })

  if (testInfo.project.name.startsWith('mobile')) {
    await expect(sidebar).toBeHidden()
  } else {
    await expect(sidebar).toBeVisible()
    const layout = await sidebar.evaluate((element) => {
      const heading = element.querySelector('h4') as HTMLElement
      const links = [...element.querySelectorAll<HTMLElement>('.app-nav')].slice(0, 3)
      const headingRect = heading.getBoundingClientRect()
      const linkRects = links.map((link) => link.getBoundingClientRect())
      return {
        sidebarDisplay: getComputedStyle(element).display,
        headingDisplay: getComputedStyle(heading).display,
        linkDisplays: links.map((link) => getComputedStyle(link).display),
        verticallyOrdered: linkRects.every((rect, index) =>
          index === 0
            ? rect.top >= headingRect.bottom - 1
            : rect.top >= linkRects[index - 1].bottom - 1
        ),
        leftAligned: linkRects.every((rect) => Math.abs(rect.left - linkRects[0].left) < 1)
      }
    })
    expect(layout.sidebarDisplay).not.toBe('flex')
    expect(layout.headingDisplay).toBe('flex')
    expect(layout.linkDisplays).toEqual(['flex', 'flex', 'flex'])
    expect(layout.verticallyOrdered).toBe(true)
    expect(layout.leftAligned).toBe(true)

    const active = sidebar.locator('.app-nav.active').first()
    await expect(active).toBeVisible()
    const activeState = await active.evaluate((element) => {
      const bar = element.querySelector('svg')
      return {
        fontWeight: getComputedStyle(element).fontWeight,
        barBackground: bar ? getComputedStyle(bar).backgroundColor : ''
      }
    })
    expect(Number(activeState.fontWeight)).toBeGreaterThanOrEqual(460)
    expect(activeState.barBackground).not.toBe('rgba(0, 0, 0, 0)')

    const hoverTarget = sidebar.locator('.app-nav').nth(1)
    const colorBefore = await hoverTarget.evaluate((element) => getComputedStyle(element).color)
    await hoverTarget.hover()
    const colorAfter = await hoverTarget.evaluate((element) => getComputedStyle(element).color)
    expect(colorAfter).not.toBe(colorBefore)
  }

  const styleText = (await readCssom(page)).text.replace(/\s/g, '')
  expect(styleText).toContain(
    ':is(h4,.app-nav){display:flex;min-height:2rem;position:relative;align-items:center;'
  )
  await expectNoHorizontalOverflow(page)
  expect(failures).toEqual([])
})

test('site semantic classes preserve cross-layer and variable alias behavior', async ({ page }) => {
  const failures = capturePageFailures(page)

  await page.goto('/en/guide/installation/vscode')
  const vscodeIcon = page.locator('[class~="ml:-3xs"]').first()
  await vscodeIcon.waitFor()
  await expect(vscodeIcon).toHaveCSS('margin-left', '-4px')

  const highlightedToken = page.locator('.shiki span[style*="--shiki-light"]').first()
  await highlightedToken.waitFor()
  const highlightedColors = await highlightedToken.evaluate((token) => {
    const variable = document.documentElement.classList.contains('dark')
      ? '--shiki-dark'
      : '--shiki-light'
    const probe = document.createElement('span')
    probe.style.color = `var(${variable})`
    token.append(probe)
    const expected = getComputedStyle(probe).color
    probe.remove()
    return {
      actual: getComputedStyle(token).color,
      expected
    }
  })
  expect(highlightedColors.actual).toBe(highlightedColors.expected)

  await page.goto('/en/design-system')
  const demo = page.locator('.demo').first()
  await demo.waitFor()
  expect(await demo.evaluate((element) => getComputedStyle(element).backgroundImage))
    .toContain('linear-gradient')

  const hydration = await readHydrationManifest(page, '/en/reference/cursor')
  await page.goto('/en/reference/cursor')
  const stripe = page.locator('[class~="bg:stripe"]').first()
  await stripe.waitFor()
  const stripeRule = hydration.rules.find((rule) => rule.className === 'bg:stripe')
  expect(stripeRule?.text).toBe('.bg\\:stripe{background:var(--stripe)}')
  expect(await stripe.evaluate((element) => getComputedStyle(element).backgroundImage))
    .toContain('linear-gradient')

  await expectNoHorizontalOverflow(page)
  expect(failures).toEqual([])
})

test('cascade layer page preserves layer bytes and statement order', async ({ page }) => {
  const failures = capturePageFailures(page)
  await page.goto('/en/guide/cascade-layers')
  await expect(page.getByRole('heading', { name: 'How layers control the cascade' })).toBeAttached()

  const layers = await readCssom(page)
  const topLevel = layers.topLevel.map((rule) => rule.replace(/\s/g, ''))
  expect(topLevel[0]).toMatch(/^@layertheme\{/)
  expect(topLevel[1]).toMatch(/^@layerbase\{/)
  expect(topLevel[2]).toBe('@layerdefaults,components,utilities;')

  const generatedLayerIndexes = ['theme', 'defaults', 'components', 'utilities'].map((layer) =>
    layers.text.lastIndexOf(`@layer ${layer} {`)
  )
  expect(generatedLayerIndexes.every((index) => index >= 0)).toBe(true)
  expect(generatedLayerIndexes).toEqual(
    [...generatedLayerIndexes].sort((left, right) => left - right)
  )
  await expectNoHorizontalOverflow(page)
  expect(failures).toEqual([])
})

test('Play loads the bundled Rust compiler Wasm and renders selector classes', async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'Play compiler sentinel runs once on desktop.')
  const failures = capturePageFailures(page)
  const wasmResponses: number[] = []
  page.on('response', (response) => {
    if (response.url().endsWith('mastercss_wasm_compiler_bg.wasm')) {
      wasmResponses.push(response.status())
    }
  })

  await page.goto('/en/play')
  await page.waitForFunction(() =>
    Boolean((window as typeof window & { __masterCSSPlayCompiler?: unknown }).__masterCSSPlayCompiler)
  )
  const result = await page.evaluate(async () => {
    const compiler = (window as typeof window & {
      __masterCSSPlayCompiler: {
        compilePlayCSS(source: string, classes: string[]): Promise<{
          css: string
          manifest: { version: number }
          warnings: string[]
        }>
      }
    }).__masterCSSPlayCompiler
    return compiler.compilePlayCSS(
      '@components { dogfood { button { @compose flex; } } }',
      ['dogfood']
    )
  })

  expect(result.manifest.version).toBe(1)
  expect(result.warnings).toEqual([])
  expect(result.css).toContain('.dogfood button{display:flex}')
  expect(wasmResponses.some((status) => status >= 200 && status < 300)).toBe(true)
  expect(failures).toEqual([])
})

function capturePageFailures(page: Page) {
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`)
  })
  return failures
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }))
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
}

async function readHydrationManifest(page: Page, route: string) {
  const htmlResponse = await page.request.get(route)
  expect(htmlResponse.ok()).toBe(true)
  const html = await htmlResponse.text()
  const source = html.match(
    /\bdata-master-css-hydration-manifest=(["'])(.*?)\1/i
  )?.[2]
  expect(source).toBeTruthy()
  const response = await page.request.get(source!)
  expect(response.ok()).toBe(true)
  return response.json() as Promise<{
    rules: Array<{ className: string, text: string }>
  }>
}

async function readCssom(page: Page) {
  return page.evaluate(() => {
    const topLevel = [...document.styleSheets, ...document.adoptedStyleSheets].flatMap(
      (stylesheet) => {
        try {
          return [...stylesheet.cssRules].map((rule) => rule.cssText)
        } catch {
          return []
        }
      }
    )
    return {
      text: topLevel.join('\n'),
      topLevel
    }
  })
}
