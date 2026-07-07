import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import guideColorNames from '../../internal/data/color-names.js'
import { COLOR_LEVELS } from '../../internal/data/color-palette.js'
import { benchmarkChartColors, bentoRows, deliveryModes, diagnosticSignals, heroExampleClassNames, heroExampleCode, homeInteractions, homeSections, nativeCssPrimitivesCode, p3PaletteColorNames, p3PaletteTiers, themeVariablesCode } from '../app/[locale]/_home/home-content.js'

test('homepage section anchors and interaction hooks stay stable', () => {
    assert.deepEqual(Object.values(homeSections), [
        'hero',
        'css-cost',
        'design-system',
        'delivery-modes',
        'code-diagnostics',
        'get-started'
    ])

    assert.deepEqual(Object.values(homeInteractions), [
        'benchmark-row',
        'cta-link'
    ])
})

test('hero example keeps a concise static Master CSS sample', () => {
    assert.deepEqual(heroExampleClassNames, [
        'grid gap:lg p:lg r:3xl surface:raised',
        'text:muted',
        'font:2xl text:strong',
        'px:md py:sm r:xl bg:yellow fg:yellow-95'
    ])

    for (const className of heroExampleClassNames) {
        assert.match(heroExampleCode, new RegExp(className.replaceAll(':', '\\:')))
    }
})

test('bento content model keeps targeted layout tiles', () => {
    assert.equal(bentoRows.length, 3)
    assert.equal(new Set(bentoRows.map((row) => row.title)).size, bentoRows.length)
    assert.deepEqual(bentoRows.map((row) => row.title), [
        'Two-column grid',
        'High-saturation P3 colors',
        'Three-column grid'
    ])
    assert.deepEqual(bentoRows.map((row) => row.gridClassName), [
        'grid-cols:1 grid-cols:2@md',
        'grid-cols:1',
        'grid-cols:1 grid-cols:3@md'
    ])
    assert.deepEqual(bentoRows.map((row) => row.gridCount), [2, 1, 3])
    assert.deepEqual(bentoRows.map((row) => row.visual || 'placeholder'), ['placeholder', 'p3-palette', 'placeholder'])
    assert.deepEqual(bentoRows[0].tiles?.map((tile) => tile.title), ['Theme modes', 'Theme variables'])
    assert.deepEqual(bentoRows[0].tiles?.map((tile) => tile.visual || 'placeholder'), ['theme-modes', 'theme-variables'])
    assert.deepEqual(bentoRows[2].tiles?.map((tile) => tile.title), ['Grid layout, transitions, animations', 'Native CSS primitives'])
    assert.deepEqual(bentoRows[2].tiles?.map((tile) => tile.visual || 'placeholder'), ['art-gallery', 'native-css-primitives'])
    assert.deepEqual(bentoRows[2].tiles?.map((tile) => 'gridColumnClassName' in tile ? tile.gridColumnClassName : 'auto'), ['grid-col-span:2@md', 'auto'])
    assert.equal(bentoRows.some((row) => row.title === 'Delivery modes'), false)
    assert.equal(bentoRows.some((row) => row.title === 'Editor and linting'), false)
    assert.equal(bentoRows.some((row) => row.title === 'Single-column grid'), false)

    for (const row of bentoRows) {
        assert.ok(row.body.length > row.title.length)
    }
})

test('theme variables bento sample maps tokens to class examples', () => {
    assert.match(themeVariablesCode, /@theme \{/)
    assert.match(themeVariablesCode, /--font-sans: "Inter"; \/\* font:sans \*\//)
    assert.match(themeVariablesCode, /--font-sans: "Inter"; \/\* font:sans \*\/\n\n\s+--spacing-md: 1rem; \/\* p:md \*\//)
    assert.doesNotMatch(themeVariablesCode, /--font-mono/)
    assert.match(themeVariablesCode, /--spacing-md: 1rem; \/\* p:md \*\//)
    assert.match(themeVariablesCode, /--spacing-lg: 1\.5rem; \/\* p:lg \*\//)
    assert.match(themeVariablesCode, /--spacing-lg: 1\.5rem; \/\* p:lg \*\/\n\n\s+--radius-lg: 0\.5rem; \/\* r:lg \*\//)
    assert.match(themeVariablesCode, /--radius-lg: 0\.5rem; \/\* r:lg \*\//)
    assert.match(themeVariablesCode, /--radius-xl: 0\.75rem; \/\* r:xl \*\//)
    assert.match(themeVariablesCode, /@theme light \{\n\s+--color-surface-base: \$color-neutral-0; \/\* surface:base \*\//)
    assert.match(themeVariablesCode, /--color-text-body: \$color-neutral-70; \/\* text:body \*\//)
    assert.match(themeVariablesCode, /@theme dark \{\n\s+--color-surface-base: \$color-gray-95; \/\* surface:base \*\//)
    assert.match(themeVariablesCode, /--color-text-body: \$color-gray-30; \/\* text:body \*\//)
    assert.doesNotMatch(themeVariablesCode, /@keyframes/)
})

test('native CSS primitives bento sample keeps a concise btn directive example', () => {
    assert.match(nativeCssPrimitivesCode, /^@import '@master\/css';/)
    assert.match(nativeCssPrimitivesCode, /@components \{/)
    assert.match(nativeCssPrimitivesCode, /btn \{/)
    assert.match(nativeCssPrimitivesCode, /btn-sm \{/)
    assert.doesNotMatch(nativeCssPrimitivesCode, /@compose btn(?:\s|;)/)
    assert.match(nativeCssPrimitivesCode, /btn-sm \{\n\s+@compose h:8x px:sm r:md font:sm;/)
    assert.doesNotMatch(nativeCssPrimitivesCode.match(/btn-sm \{[\s\S]+?\n    \}/)?.[0] || '', /inline-flex|items-center|justify-center|gap:xs/)
    assert.match(nativeCssPrimitivesCode, /&:hover \{\n\s+background: var\(--color-blue-70\);\n\s+\}/)
    assert.match(nativeCssPrimitivesCode, /@dark \{\n\s+color: var\(--color-blue-100\);\n\s+background: var\(--color-blue-50\);\n\s+\}/)
    assert.doesNotMatch(nativeCssPrimitivesCode, /@variant/)
})

test('homepage code windows do not override font size or line height', () => {
    const homeCodeWindowSources = [
        '../app/[locale]/_home/BentoSection.tsx',
        '../app/[locale]/_home/HeroExampleStage.tsx'
    ].map((filePath) => readFileSync(new URL(filePath, import.meta.url), 'utf8'))

    for (const source of homeCodeWindowSources) {
        assert.doesNotMatch(source, /(?:codeClassName|preClassName)="[^"]*(?:font:|leading:)/)
    }
})

test('native CSS primitives code window stays top-aligned in its card', () => {
    const source = readFileSync(new URL('../app/[locale]/_home/BentoSection.tsx', import.meta.url), 'utf8')
    const nativeCard = source.match(/function NativeCssPrimitivesCard[\s\S]+?function P3PaletteCard/)?.[0]

    assert.ok(nativeCard)
    assert.match(nativeCard, /bentoTopVisualClassName/)
    assert.doesNotMatch(nativeCard, /bentoVisualClassName/)
})

test('homepage bento code windows keep their fixed preview height', () => {
    const source = readFileSync(new URL('../app/[locale]/_home/BentoSection.tsx', import.meta.url), 'utf8')

    for (const functionName of ['ThemeVariablesCard', 'NativeCssPrimitivesCard']) {
        const card = source.match(new RegExp(`function ${functionName}[\\s\\S]+?(?=function )`))?.[0]

        assert.ok(card)
        assert.match(card, /'h:md'/)
        assert.doesNotMatch(card, /flex:1|min-h:md/)
    }
})

test('homepage P3 palette preview uses every guide color in reverse order', () => {
    assert.deepEqual(p3PaletteColorNames, [...guideColorNames].reverse())
    assert.deepEqual(p3PaletteTiers, [...COLOR_LEVELS].reverse())
    assert.equal(new Set(p3PaletteColorNames).size, p3PaletteColorNames.length)
    assert.equal(p3PaletteColorNames.length, guideColorNames.length)
})

test('delivery modes content model links to rendering mode sections', () => {
    assert.equal(deliveryModes.length, 3)
    assert.deepEqual(deliveryModes.map((mode) => mode.title), [
        'Runtime rendering',
        'Static rendering',
        'Progressive rendering'
    ])
    assert.equal(new Set(deliveryModes.map((mode) => mode.href)).size, deliveryModes.length)
    assert.equal(new Set(deliveryModes.map((mode) => mode.icon)).size, deliveryModes.length)

    for (const mode of deliveryModes) {
        assert.match(mode.href, /^\/guide\/rendering-modes#/)
        assert.match(mode.accent, /^bg:/)
        assert.ok(mode.body.length > mode.title.length)
        assert.ok(mode.signal.length > 0)
    }
})

test('diagnostic signal content model is agent-oriented and reviewable', () => {
    assert.equal(diagnosticSignals.length, 3)
    assert.deepEqual(diagnosticSignals.map((signal) => signal.status), ['context', 'lint', 'preview'])

    for (const signal of diagnosticSignals) {
        assert.match(signal.accent, /^bg:/)
        assert.ok(signal.body.length > signal.title.length)
    }
})

test('benchmark chart tones keep compact homepage palettes', () => {
    assert.deepEqual(benchmarkChartColors.cssVolume, ['bg:blue', 'bg:green', 'bg:yellow', 'bg:red'])
    assert.deepEqual(benchmarkChartColors.domScaling, ['bg:green', 'bg:yellow', 'bg:red'])
})
