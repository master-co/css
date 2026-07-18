import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import guideColorNames from '../../internal/data/color-names.js'
import { COLOR_LEVELS } from '../../internal/data/color-palette.js'
import { agentDiagnosticCards, benchmarkChartColors, deliveryModes, designSystemRows, developmentWorkflowCards, heroExampleClassNames, heroExampleCode, homeInteractions, homeSections, languageServiceCards, nativeCssPrimitivesCode, p3PaletteColorNames, p3PaletteTiers, themeVariablesCode } from '../app/[locale]/_home/home-content.js'

const homeStyleSource = readFileSync(new URL('../app/[locale]/home.css', import.meta.url), 'utf8')
const globalsSource = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')

test('homepage section anchors and interaction hooks stay stable', () => {
    assert.deepEqual(Object.values(homeSections), [
        'hero',
        'css-cost',
        'design-system',
        'delivery-modes',
        'code-diagnostics',
        'language-service',
        'development-workflow',
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

test('design system content model keeps targeted bento layout tiles', () => {
    assert.equal(designSystemRows.length, 3)
    assert.equal(new Set(designSystemRows.map((row) => row.title)).size, designSystemRows.length)
    assert.deepEqual(designSystemRows.map((row) => row.title), [
        'Tokenized themes',
        'Wide-gamut color system',
        'Modern CSS primitives'
    ])
    assert.deepEqual(designSystemRows.map((row) => row.gridClassName), [
        'grid-cols:1 grid-cols:2@md',
        'grid-cols:1',
        'grid-cols:1 grid-cols:3@md'
    ])
    assert.deepEqual(designSystemRows.map((row) => row.gridCount), [2, 1, 3])
    assert.deepEqual(designSystemRows.map((row) => row.visual || 'placeholder'), ['placeholder', 'p3-palette', 'placeholder'])
    assert.deepEqual(designSystemRows[0].tiles?.map((tile) => tile.title), ['Theme modes without forks', 'System-wide variables'])
    assert.deepEqual(designSystemRows[0].tiles?.map((tile) => tile.visual || 'placeholder'), ['theme-modes', 'theme-variables'])
    assert.deepEqual(designSystemRows[2].tiles?.map((tile) => tile.title), ['Layout and motion, together', 'Reusable native CSS'])
    assert.deepEqual(designSystemRows[2].tiles?.map((tile) => tile.visual || 'placeholder'), ['art-gallery', 'native-css-primitives'])
    assert.deepEqual(designSystemRows[2].tiles?.map((tile) => 'gridColumnClassName' in tile ? tile.gridColumnClassName : 'auto'), ['grid-col-span:2@md', 'auto'])
    assert.equal(designSystemRows.some((row) => row.title === 'Delivery modes'), false)
    assert.equal(designSystemRows.some((row) => row.title === 'Editor and linting'), false)
    assert.equal(designSystemRows.some((row) => row.title === 'Single-column grid'), false)

    for (const row of designSystemRows) {
        assert.ok(row.body.length > row.title.length)
    }
})

test('homepage section labels use the shared yellow treatment', () => {
    const pageSource = readFileSync(new URL('../app/[locale]/page.tsx', import.meta.url), 'utf8')
    assert.doesNotMatch(globalsSource, /@import ['"]\.\.\/styles\/home\.css['"]/)
    assert.match(pageSource, /import '\.\/home\.css'/)
    assert.match(homeStyleSource, /@reference '\.\.\/globals\.css';/)
    assert.doesNotMatch(homeStyleSource, /@layer components \{/)
    assert.doesNotMatch(homeStyleSource, /@components\b/)
    assert.doesNotMatch(homeStyleSource, /@theme\b/)
    assert.match(homeStyleSource, /home-section-label\s*\{[\s\S]+?\btext:yellow\b/)
    assert.match(homeStyleSource, /home-section-heading\s*\{[\s\S]+?\btext-balance\b/)
    assert.match(homeStyleSource, /home-section-body\s*\{[\s\S]+?\btext:muted\b/)
    assert.match(homeStyleSource, /@variant md \{/)
    assert.doesNotMatch(homeStyleSource, /@variant @/)

    const homeSectionSources = [
        '../app/[locale]/_home/AgentDiagnosticsSection.tsx',
        '../app/[locale]/_home/BenchmarkSection.tsx',
        '../app/[locale]/_home/CTASection.tsx',
        '../app/[locale]/_home/DeliveryModesSection.tsx',
        '../app/[locale]/_home/DesignSystemSection.tsx',
        '../app/[locale]/_home/DevelopmentWorkflowSection.tsx',
        '../app/[locale]/_home/LanguageServiceSection.tsx'
    ].map((filePath) => readFileSync(new URL(filePath, import.meta.url), 'utf8'))

    for (const source of homeSectionSources) {
        assert.match(source, /home-section-label/)
        assert.doesNotMatch(source, /sectionLabelClassName|sectionHeadingClassName|sectionBodyClassName/)
        assert.doesNotMatch(source, /\btext:blue\b/)
    }
})

test('homepage places agent diagnostics immediately after CSS cost', () => {
    const source = readFileSync(new URL('../app/[locale]/_home/HomePage.tsx', import.meta.url), 'utf8')
    const benchmarkIndex = source.indexOf('<BenchmarkSection')
    const diagnosticsIndex = source.indexOf('<AgentDiagnosticsSection')
    const languageServiceIndex = source.indexOf('<LanguageServiceSection')
    const workflowIndex = source.indexOf('<DevelopmentWorkflowSection')
    const deliveryModesIndex = source.indexOf('<DeliveryModesSection')

    assert.notEqual(benchmarkIndex, -1)
    assert.notEqual(diagnosticsIndex, -1)
    assert.notEqual(languageServiceIndex, -1)
    assert.notEqual(workflowIndex, -1)
    assert.notEqual(deliveryModesIndex, -1)
    assert.ok(benchmarkIndex < diagnosticsIndex)
    assert.ok(diagnosticsIndex < languageServiceIndex)
    assert.ok(languageServiceIndex < workflowIndex)
    assert.ok(workflowIndex < deliveryModesIndex)
})

test('homepage benchmark chart uses shared segmented control', () => {
    const chartSource = readFileSync(new URL('../app/[locale]/_home/BenchmarkSizeChart.tsx', import.meta.url), 'utf8')
    const segmentSource = readFileSync(new URL('../app/[locale]/_home/HomeSegmentedControl.tsx', import.meta.url), 'utf8')

    assert.match(chartSource, /HomeSegmentedControl/)
    assert.doesNotMatch(chartSource, /aria-pressed=\{active\}/)
    assert.match(segmentSource, /home-segmented-control/)
    assert.match(segmentSource, /home-segmented-control-option-active/)
    assert.match(homeStyleSource, /--home-segmented-control-padding: 3px/)
    assert.match(homeStyleSource, /--home-segmented-control-radius: var\(--radius-xl\)/)
    assert.match(homeStyleSource, /p:var\(--home-segmented-control-padding\)/)
    assert.match(homeStyleSource, /border-radius: max\(0px, calc\(var\(--home-segmented-control-radius\) - var\(--home-segmented-control-padding\)\)\)/)
    assert.doesNotMatch(homeStyleSource.match(/home-segmented-control[\s\S]+?home-active-syntax/)?.[0] || '', /\boutline:/)
})

test('theme variables bento sample maps tokens to class examples', () => {
    assert.match(themeVariablesCode, /@theme \{/)
    assert.match(themeVariablesCode, /--font-sans: "Inter"; \/\* font:sans \*\//)
    assert.match(themeVariablesCode, /--font-sans: "Inter"; \/\* font:sans \*\/\n\n\s+--spacing-md: 1rem;\s+\/\* p:md \*\//)
    assert.doesNotMatch(themeVariablesCode, /--font-mono/)
    assert.match(themeVariablesCode, /--spacing-md: 1rem;\s+\/\* p:md \*\//)
    assert.match(themeVariablesCode, /--spacing-lg: 1\.5rem; \/\* p:lg \*\//)
    assert.match(themeVariablesCode, /--spacing-lg: 1\.5rem; \/\* p:lg \*\/\n\n\s+--radius-lg: 0\.5rem;\s+\/\* r:lg \*\//)
    assert.match(themeVariablesCode, /--radius-lg: 0\.5rem;\s+\/\* r:lg \*\//)
    assert.match(themeVariablesCode, /--radius-xl: 0\.75rem; \/\* r:xl \*\//)
    assert.match(themeVariablesCode, /@theme light \{\n\s+--color-surface-base: var\(--color-neutral-0\); \/\* surface:base \*\//)
    assert.match(themeVariablesCode, /--color-text-body: var\(--color-neutral-70\);\s+\/\* text:body \*\//)
    assert.match(themeVariablesCode, /@theme dark \{\n\s+--color-surface-base: var\(--color-gray-95\);\s+\/\* surface:base \*\//)
    assert.match(themeVariablesCode, /--color-text-body: var\(--color-gray-30\);\s+\/\* text:body \*\//)
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
    assert.match(nativeCssPrimitivesCode, /@dark \{\n\s+background: var\(--color-blue-50\);\n\s+\}/)
    assert.doesNotMatch(nativeCssPrimitivesCode, /@variant/)
})

test('homepage code windows do not override font size or line height', () => {
    const homeCodeWindowSources = [
        '../app/[locale]/_home/DesignSystemSection.tsx',
        '../app/[locale]/_home/HeroExampleStage.tsx',
        '../app/[locale]/_home/LanguageServiceSection.tsx'
    ].map((filePath) => readFileSync(new URL(filePath, import.meta.url), 'utf8'))

    for (const source of homeCodeWindowSources) {
        assert.doesNotMatch(source, /(?:codeClassName|preClassName)="[^"]*(?:font:|leading:)/)
    }
})

test('homepage code windows centralize code padding', () => {
    const codeWindowSource = readFileSync(new URL('../app/[locale]/_home/HomeCodeWindow.tsx', import.meta.url), 'utf8')
    const callerSources = [
        '../app/[locale]/_home/AgentDiagnosticsSection.tsx',
        '../app/[locale]/_home/DesignSystemSection.tsx',
        '../app/[locale]/_home/HeroExampleStage.tsx',
        '../app/[locale]/_home/LanguageServiceSection.tsx'
    ].map((filePath) => readFileSync(new URL(filePath, import.meta.url), 'utf8'))

    assert.match(codeWindowSource, /home-code-window-pre/)
    assert.match(homeStyleSource, /home-code-window-pre\s*\{[\s\S]+?\bpx:sm py:lg\b/)
    for (const source of callerSources) {
        assert.doesNotMatch(source, /preClassName="[^"]*\bpy:lg\b/)
    }
})

test('native CSS primitives code window stays top-aligned in its card', () => {
    const source = readFileSync(new URL('../app/[locale]/_home/DesignSystemSection.tsx', import.meta.url), 'utf8')
    const nativeCard = source.match(/function NativeCssPrimitivesCard[\s\S]+?function P3PaletteCard/)?.[0]

    assert.ok(nativeCard)
    assert.match(nativeCard, /home-bento-visual-top/)
    assert.doesNotMatch(nativeCard, /home-bento-visual h:md/)
})

test('homepage bento code windows keep their fixed preview height', () => {
    const source = readFileSync(new URL('../app/[locale]/_home/DesignSystemSection.tsx', import.meta.url), 'utf8')

    for (const functionName of ['ThemeVariablesCard', 'NativeCssPrimitivesCard']) {
        const card = source.match(new RegExp(`function ${functionName}[\\s\\S]+?(?=function )`))?.[0]

        assert.ok(card)
        assert.match(card, /className=(?:"[^"]*\bh:md\b[^"]*"|'[^']*\bh:md\b[^']*')/)
        assert.doesNotMatch(card, /flex:1|min-h:md/)
    }
})

test('agent diagnostics section uses the shared homepage bento UI', () => {
    const source = readFileSync(new URL('../app/[locale]/_home/AgentDiagnosticsSection.tsx', import.meta.url), 'utf8')
    const codeWindowSource = readFileSync(new URL('../app/[locale]/_home/HomeCodeWindow.tsx', import.meta.url), 'utf8')

    assert.match(source, /HomeBentoFrame/)
    assert.match(source, /HomeBentoGrid/)
    assert.match(source, /HomeBentoCard/)
    assert.match(source, /HomeCodeWindow/)
    assert.doesNotMatch(source, /\bh:52x\b/)
    assert.match(homeStyleSource, /home-code-window-problems-bar\s*\{[\s\S]+?items-center gap:xs px:md py:sm/)
    assert.doesNotMatch(codeWindowSource, /justify-between/)
    assert.match(codeWindowSource, /IconCircleX/)
    assert.match(codeWindowSource, /IconAlertTriangle/)
    assert.match(codeWindowSource, /IconInfoCircle/)
    assert.doesNotMatch(codeWindowSource, /size:2x mt:3xs r:full/)
    assert.match(codeWindowSource, /fixPreviewCode\?: string/)
    assert.match(codeWindowSource, /home-code-window-has-fix/)
    assert.match(homeStyleSource, /:where\(:hover, :active\) \.home-code-window__source \{[\s\S]+?opacity:\s*0/)
    assert.match(homeStyleSource, /:where\(:hover, :active\) \.home-code-window__fix \{[\s\S]+?opacity:\s*1/)
    assert.match(homeStyleSource, /transition:opacity\|\.16s\|ease-out/)
    assert.doesNotMatch(homeStyleSource, /transition:opacity\|\.2s\|ease-out/)
    assert.match(source, /grid-cols:1 grid-cols:2@md/)
    assert.match(source, /agentDiagnosticCards\.map/)
    assert.doesNotMatch(source, /homeBentoDotGridStyle/)
    assert.match(homeStyleSource, /home-bento-card\s*\{[\s\S]+?surface:base/)
    assert.match(source, /@ERROR text-decoration:bad\(\)/)
    assert.match(source, /Class "text-decoration:bad\(\)" emits invalid CSS: Invalid value for `text-decoration-color` property\./)
    assert.match(source, /Sort classes into the expected order: "rel flex px:4x font:md bg:white"\./)
    assert.match(source, /Remove class "m:0"; it is overridden by later class "m:md"\./)
    assert.match(source, /Use canonical class "text-center" instead of "text-align:center"\./)
    assert.match(source, /Use canonical class "fg:red-60" instead of "fg:var\(--color-red-60\)"\./)
    assert.doesNotMatch(source, /Use canonical class "m:md" instead of "margin:md"\./)
    assert.doesNotMatch(source, /Use canonical class "font:md" instead of "font:16px"\./)
    assert.doesNotMatch(source, /No consistent class order followed/)
    assert.doesNotMatch(source, /Prefer theme tokens for matching raw values/)
    assert.doesNotMatch(source, /invalidClassesFixPreviewCode/)
    assert.equal(source.match(/fixPreviewCode=\{/g)?.length, 4)
    assert.match(source, /fixPreviewCode={classOrderFixPreviewCode}/)
    assert.match(source, /fixPreviewCode={conflictingClassesFixPreviewCode}/)
    assert.match(source, /fixPreviewCode={canonicalUtilitiesFixPreviewCode}/)
    assert.match(source, /fixPreviewCode={themeTokensFixPreviewCode}/)
    assert.match(source, /<article class="rel flex px:4x font:md bg:white">/)
    assert.match(source, /<section class="grid gap:md m:md">/)
    assert.match(source, /<h2 class="text-center">/)
    assert.match(source, /<p class="fg:red-60">/)
    assert.match(source, /@WARN bg:white font:md flex px:4x rel/)
    assert.match(source, /@WARN m:0/)
    assert.match(source, /@WARN text-align:center/)
    assert.match(source, /@WARN fg:var\(--color-red-60\)/)
    assert.doesNotMatch(source, /@WARN margin:md/)
    assert.doesNotMatch(source, /@WARN font:16px/)
    assert.match(source, /mastercss_preview_fixes/)
    assert.match(source, /@master\/css\/sort-classes/)
    assert.match(source, /problems=/)
    assert.doesNotMatch(source, /Array\.from\(\{ length: 6 \}/)
    assert.doesNotMatch(source, /Link/)
    assert.doesNotMatch(source, /Icon[A-Z]/)
    assert.doesNotMatch(source, /diagnosticSignals/)
})

test('agent diagnostic card content model lists class diagnostic rules', () => {
    assert.equal(agentDiagnosticCards.length, 6)
    assert.deepEqual(agentDiagnosticCards.map((card) => card.title), [
        'Invalid classes',
        'Class order',
        'Conflicting classes',
        'Canonical utilities',
        'Theme tokens',
        'Safe fix preview'
    ])

    for (const card of agentDiagnosticCards) {
        assert.ok(card.body.length > card.title.length)
    }
})

test('language service section uses shared homepage bento visuals', () => {
    const source = readFileSync(new URL('../app/[locale]/_home/LanguageServiceSection.tsx', import.meta.url), 'utf8')

    assert.match(source, /HomeBentoFrame/)
    assert.match(source, /HomeBentoGrid/)
    assert.match(source, /HomeBentoCard/)
    assert.match(source, /HomeCodeWindow/)
    assert.match(source, /languageServiceCards\.map/)
    assert.match(source, /homeSections\.languageService/)
    assert.match(source, /Readable, and still human\./)
    assert.match(source, /grid-cols:1 grid-cols:2@md/)
    assert.doesNotMatch(source, /grid-cols:3@lg/)
    assert.doesNotMatch(source, /grid-col-span:2@md/)
    assert.match(source, /home-bento-visual/)
    assert.doesNotMatch(source, /h:28x/)
    assert.match(source, /ManifestAwareSuggestionsPreview/)
    assert.match(source, /manifestSuggestionsCode/)
    assert.match(source, /<button class="text:amber">/)
    assert.match(source, /manifestSuggestionItems/)
    assert.match(source, /manifestSuggestionsShikiOptions/)
    assert.match(source, /classAttributeValueWrapper/)
    assert.match(source, /createManifestSuggestionsMenuHast/)
    assert.match(source, /masterCSS={manifestSuggestionsShikiOptions}/)
    assert.match(source, /label: 'amber'/)
    assert.match(source, /label: 'beryl'/)
    assert.match(source, /label: '3xs'/)
    assert.match(source, /label: 'sm'/)
    assert.match(source, /\(scope\) color-text-amber/)
    assert.match(source, /IconPalette/)
    assert.match(source, /IconDeviceDesktop/)
    assert.match(source, /data-tabler-icon/)
    assert.match(source, /createManifestSuggestionsIconElement/)
    assert.match(source, /home-manifest-suggestions__item-icon-\$\{iconName\}/)
    assert.doesNotMatch(source, /label: 'hover'/)
    assert.doesNotMatch(source, /--color-text-link/)
    assert.match(source, /home-manifest-suggestions/)
    assert.match(source, /home-manifest-suggestions__window/)
    assert.match(source, /home-manifest-suggestions__class-value/)
    assert.doesNotMatch(source, /className="home-manifest-suggestions__menu"/)
    assert.match(source, /activeSyntaxHighlightingCode/)
    assert.match(source, /text:3xl@md/)
    assert.match(source, /fg:blue-60:hover/)
    assert.doesNotMatch(source, /@MARK/)
    assert.doesNotMatch(source, /\.mark/)
    assert.match(homeStyleSource, /--home-manifest-suggestions-cycle: 8\.8s/)
    assert.match(homeStyleSource, /home-manifest-suggestions-type/)
    assert.match(homeStyleSource, /home-manifest-suggestions-type var\(--home-manifest-suggestions-cycle\) steps\(1, end\) infinite/)
    assert.doesNotMatch(homeStyleSource, /home-manifest-suggestions-type-text/)
    assert.match(homeStyleSource, /home-manifest-suggestions-caret-position/)
    assert.match(homeStyleSource, /home-manifest-suggestions-menu/)
    assert.match(homeStyleSource, /home-manifest-suggestions-menu var\(--home-manifest-suggestions-cycle\) steps\(1, end\) infinite/)
    assert.match(homeStyleSource, /home-manifest-suggestions__item-icon-scope/)
    assert.match(homeStyleSource, /home-manifest-suggestions__item-icon-screen/)
    assert.match(homeStyleSource, /surface:base text:body/)
    assert.match(homeStyleSource, /--home-manifest-suggestions-item-bg: var\(--color-surface-base\)/)
    assert.match(homeStyleSource, /home-manifest-suggestions__class-value::after/)
    assert.match(homeStyleSource, /background: var\(--color-text-strong\)/)
    assert.match(homeStyleSource, /line:first-child::after/)
    assert.doesNotMatch(homeStyleSource, /home-manifest-suggestions__window \.line:first-child::before/)
    assert.match(homeStyleSource, /mcss-semantic-role-value-keyword/)
    assert.doesNotMatch(homeStyleSource, /home-manifest-suggestions-menu-pin/)
    assert.doesNotMatch(homeStyleSource, /home-manifest-suggestions-menu-base-x/)
    assert.doesNotMatch(homeStyleSource, /home-manifest-suggestions-menu-top/)
    assert.doesNotMatch(homeStyleSource, /home-manifest-suggestions-menu-offset-x/)
    assert.doesNotMatch(homeStyleSource, /24ch/)
    assert.doesNotMatch(homeStyleSource, /transform: translateX/)
    assert.doesNotMatch(homeStyleSource, /translate:/)
    assert.doesNotMatch(homeStyleSource, /steps\(5, end\)/)
    assert.match(homeStyleSource, /91%, 100% \{\n\s+left: 10ch;\n\s+opacity: 0;\n\s+visibility: hidden;/)
    assert.match(homeStyleSource, /@container \(max-width: 540px\)/)
    assert.match(source, /home-active-syntax/)
    assert.doesNotMatch(source, /<style>/)
    assert.match(homeStyleSource, /\.mcss-semantic/)
    assert.match(homeStyleSource, /--home-active-syntax-cycle: 8s/)
    assert.match(homeStyleSource, /steps\(1, end\)/)
    assert.match(homeStyleSource, /home-active-syntax-token/)
    assert.match(homeStyleSource, /home-active-syntax-line-window/)
    assert.match(homeStyleSource, /\.line::after/)
    assert.match(homeStyleSource, /25%, 100% \{\n\s+color: currentColor/)
    assert.doesNotMatch(homeStyleSource, /--home-active-syntax-token-active/)
    assert.ok((homeStyleSource.match(/\.line:nth-child/g)?.length || 0) >= 8)
    assert.match(homeStyleSource, /\.line \.mcss-semantic::before/)
    assert.match(homeStyleSource, /\.line \.mcss-semantic\s*~\s*\.mcss-semantic::before/)
    assert.match(homeStyleSource, /position: relative/)
    assert.match(homeStyleSource, /position: absolute/)
    assert.match(homeStyleSource, /--home-active-syntax-delay: -6s/)
    assert.match(homeStyleSource, /--home-active-syntax-delay: -2s/)
    assert.match(homeStyleSource, /home-active-syntax-caret-window/)
    assert.match(homeStyleSource, /home-active-syntax-caret-blink 1s/)
    assert.doesNotMatch(homeStyleSource, /margin-right/)
    assert.match(homeStyleSource, /@keyframes home-active-syntax-caret-window/)
    assert.match(homeStyleSource, /@keyframes home-active-syntax-caret-blink/)
})

test('language service card content model lists editor integration features', () => {
    assert.equal(languageServiceCards.length, 2)
    assert.deepEqual(languageServiceCards.map((card) => card.title), [
        'Manifest-aware suggestions',
        'Active syntax highlighting'
    ])
    assert.equal(languageServiceCards.filter((card) => card.visual).length, 2)
    assert.equal(languageServiceCards[0].visual, 'manifest-aware-suggestions')
    assert.equal(languageServiceCards[1].visual, 'active-syntax-highlighting')

    for (const card of languageServiceCards) {
        assert.ok(card.body.length > card.title.length)
    }
})

test('development workflow section promotes workspace and build workflow features', () => {
    const source = readFileSync(new URL('../app/[locale]/_home/DevelopmentWorkflowSection.tsx', import.meta.url), 'utf8')

    assert.match(source, /homeSections\.developmentWorkflow/)
    assert.match(source, /First-class development workflow\./)
    assert.match(source, /developmentWorkflowCards\.map/)
    assert.match(source, /HomeBentoFrame/)
    assert.match(source, /HomeBentoGrid/)
    assert.match(source, /HomeBentoCard/)
    assert.match(source, /grid-cols:1 grid-cols:2@md grid-cols:4@xl/)
    assert.match(source, /home-workflow-signal/)
    assert.match(homeStyleSource, /home-workflow-card/)
    assert.match(homeStyleSource, /home-workflow-signal/)
    assert.equal(developmentWorkflowCards.length, 4)
    assert.deepEqual(developmentWorkflowCards.map((card) => card.title), [
        'Workspace-aware manifests',
        'Build-tool mode integration',
        'Route-level styles',
        'Project policy feedback'
    ])

    for (const card of developmentWorkflowCards) {
        assert.ok(card.body.length > card.title.length)
        assert.ok(card.signal.length > 0)
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

test('benchmark chart tones keep compact homepage palettes', () => {
    assert.deepEqual(benchmarkChartColors.cssVolume, ['bg:blue', 'bg:green', 'bg:yellow', 'bg:red'])
    assert.deepEqual(benchmarkChartColors.domScaling, ['bg:green', 'bg:yellow', 'bg:red'])
})
