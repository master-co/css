import { describe, expect, test } from 'vitest'
import { compileCSS, compileCSSManifest } from '../src/node-compiler'
import type { CompilerDiagnosticRecorder } from '../src/compiler-diagnostics'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import { UtilityType } from '@master/css-schema/utility-type'
import { createTestCSS } from './helpers/rust-engine'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function variablesOf(manifest: MasterCSSManifest) {
  return flattenMasterCSSManifestVariables(manifest.variables)
}

function normalizeDeclarationOrder(css: string) {
  return css.replace(/\{([^{}]*)\}/g, (_, body: string) => {
    if (!body.includes(':')) return `{${body}}`
    const declarations = body.split(';').filter(Boolean).sort()
    return `{${declarations.join(';')}}`
  })
}

class TestDiagnosticRecorder implements CompilerDiagnosticRecorder {
  readonly counts: Record<string, number> = {}

  time<T>(_metricId: string, callback: () => T): T {
    return callback()
  }

  addCount(metricId: string, value = 1) {
    this.counts[metricId] = (this.counts[metricId] || 0) + value
  }

  setCount(metricId: string, value: number) {
    this.counts[metricId] = value
  }
}

function compileCSSManifestWithDiagnostics(source: string) {
  const diagnostics = new TestDiagnosticRecorder()
  const result = compileCSSManifest(source, {
    baseManifest: defaultManifest,
    diagnostics
  } as NonNullable<Parameters<typeof compileCSSManifest>[1]> & { diagnostics: CompilerDiagnosticRecorder })
  return { result, diagnostics }
}

describe.concurrent('CSS-first lowering for migrated core tests', () => {
  test('lowers theme variables, modes, semantic components, utilities, and variants into one manifest', () => {
    const { manifest, warnings } = compileCSSManifest(`
      @settings {
        mode-trigger: class;
        modes: light dark;
      }

      @theme {
        --color-primary: #000;
        --spacing-card: 1rem;
      }

      @theme dark {
        --color-primary: #fff;
      }

      @custom-variant print {
        @media print {
          @slot;
        }
      }

      @components {
        btn {
          display: inline-flex;
          color: var(--color-primary);

          @variant print {
            display: none;
          }

          &:disabled>span {
            display: block;
          }

          &:even {
            display: grid;
          }
        }
      }

      @utilities {
        content-auto {
          content-visibility: auto;
        }
      }
    `, {
      baseManifest: defaultManifest
    })

    expect(warnings).toEqual([])
    expect(manifest.settings).toMatchObject({
      modeTrigger: 'class',
      modes: ['light', 'dark']
    })
    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'spacing-card',
      namespace: 'spacing',
      type: 'number',
      value: '1rem',
      numeric: { value: 1, unit: 'rem' }
    }))
    expect(manifest.conditions?.print).toMatchObject({
      id: 'media',
      nodes: [expect.objectContaining({ type: 'string', value: 'print' })]
    })
    expect(manifest.utilities?.some((utility) => utility.name === 'btn' && utility.layer === 'components')).toBe(true)
    expect(manifest.utilities?.some((utility) => utility.name === 'content-auto' && utility.layer === 'utilities')).toBe(true)

    const css = createTestCSS(manifest)
    css.ensureClassRules('btn', 'content-auto', 'm:card')
    expect(css.themeLayer.text).toContain(':root{--color-primary:#000;--spacing-card:1rem}')
    expect(css.themeLayer.text).toContain('.dark{color-scheme:dark;--color-primary:#fff}')
    expect(css.componentsLayer.text).toContain('.btn{display:inline-flex;color:var(--color-primary)}')
    expect(css.componentsLayer.text).toContain('@media print{.btn{display:none}}')
    expect(css.componentsLayer.text).toContain('.btn:disabled>span{display:block}')
    expect(css.componentsLayer.text).toContain('.btn:nth-child(2n){display:grid}')
    expect(css.utilitiesLayer.text).toContain('.content-auto{content-visibility:auto}')
    expect(css.utilitiesLayer.text).toContain('.m\\:card{margin:var(--spacing-card)}')
  })

  test('lowers managed enum patterns as semantic utilities without replacing exact utility precedence', () => {
    const { manifest } = compileCSSManifest(`
      @utilities {
        text-<left|right|center> {
          text-align: --value();
        }

        n-<1|2> {
          margin: calc(--value() * 1px);
        }

        bg-origin-<border=border-box|content=content-box> {
          background-origin: --value();
        }

        label-<info|warn> {
          content: "--value()";
          color: --value();
        }

        text-center {
          text-align: start;
        }
      }

      @components {
        badge-<success|danger> {
          color: --value();
        }
      }
    `, {
      baseManifest: defaultManifest
    })

    expect(manifest.utilities?.some((utility) => utility.matchers.some((matcher) => matcher.type === 'pattern'))).toBe(true)
    expect(manifest.utilities?.find((utility) => utility.id === 'text-<left|right|center>')).toMatchObject({
      type: UtilityType.Semantic,
      matchers: [{
        type: 'pattern',
        prefix: 'text-',
        values: ['left', 'right', 'center']
      }]
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'bg-origin-<border=border-box|content=content-box>')).toMatchObject({
      type: UtilityType.Semantic,
      matchers: [{
        type: 'pattern',
        prefix: 'bg-origin-',
        values: ['border', 'content'],
        valueMap: {
          border: 'border-box',
          content: 'content-box'
        }
      }]
    })

    const css = createTestCSS(manifest)
    expect(css.createRule('text-left')?.text).toBe('.text-left{text-align:left}')
    expect(css.createRule('n-2')?.text).toBe('.n-2{margin:calc(2 * 1px)}')
    expect(css.createRule('bg-origin-border')?.text).toBe('.bg-origin-border{background-origin:border-box}')
    expect(css.createRule('label-info')?.text).toBe('.label-info{content:"--value()";color:info}')
    expect(css.createRule('text-center')?.text).toBe('.text-center{text-align:start}')
    expect(css.createRule('badge-success')?.text).toBe('.badge-success{color:success}')
    expect(css.createRule('badge-success')?.type).toBe(UtilityType.Semantic)
    expect(css.createRule('badge-success')?.layerName).toBe('components')
  })

  test('lowers managed dynamic colon entries without restoring fixed keyword aliases', () => {
    const { manifest } = compileCSSManifest(`
      @theme {
        --font-size-sm: .875rem;
        --font-family-sans: ui-sans-serif;
        --font-weight-bold: 700;
        --color-red: red;
        --color-text-red: #900;
      }

      @utilities {
        font:<~font-size|number> {
          font-size: --value();
        }

        font:<~font-family> {
          font-family: --value();
        }

        font:<~font-weight> {
          font-weight: --value();
        }

        bg:<color> {
          background-color: --value();
        }

        fg:<~color-text|color> {
          color: --value();
        }

        grid-cols:<number|*> {
          display: grid;
          grid-template-columns: repeat(--value(), minmax(0, 1fr));
        }

        grid-col-span:<number|*> {
          grid-column: span --value()/span --value();
        }

        size:<~container|number|*> {
          width: --value();
          height: --value();
        }

        gap:<*|number> {
          gap: --value();
        }

        accent:<color|*> {
          accent-color: --value();
        }

        user-select:<auto|none|text|all> {
          -webkit-user-select: --value();
          user-select: --value();
        }

        line-clamp:<number|none> {
          -webkit-line-clamp: --value();
        }

        text:<~font-size|number> {
          font-size: --value();
          line-height: max(1.8em - max(0rem, --value() - 1rem) * 1.12, --value());
          letter-spacing: clamp(-0.072em, calc((--value() - 1rem) * -0.048), 0em);
        }

        text-decoration:<~color|*> {
          -webkit-text-decoration: --value();
          text-decoration: --value();
        }
      }
    `)

    expect(manifest.utilities?.find((utility) => utility.id === 'font:<~font-size|number>')).toMatchObject({
      kind: 'number',
      variableAliasRefs: ['~font-size'],
      matchers: expect.arrayContaining([
        { type: 'variable', keys: ['font'] },
        { type: 'value', keys: ['font'] }
      ])
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'grid-cols:<number|*>')).toMatchObject({
      kind: 'number',
      type: UtilityType.Normal,
      matchers: expect.arrayContaining([
        { type: 'value', keys: ['grid-cols'] },
        { type: 'key', keys: ['grid-cols'] }
      ])
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'size:<~container|number|*>')).toMatchObject({
      kind: 'number',
      type: UtilityType.Shorthand,
      variableAliasRefs: ['~container'],
      matchers: expect.arrayContaining([
        { type: 'variable', keys: ['size'] },
        { type: 'value', keys: ['size'] },
        { type: 'key', keys: ['size'] }
      ])
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'gap:<*|number>')).toMatchObject({
      kind: 'number',
      matchers: expect.arrayContaining([
        { type: 'value', keys: ['gap'] },
        { type: 'key', keys: ['gap'] }
      ])
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'accent:<~color|color|*>')).toMatchObject({
      kind: 'color',
      variableAliasRefs: ['~color'],
      matchers: expect.arrayContaining([
        { type: 'variable', keys: ['accent'] },
        { type: 'value', keys: ['accent'] },
        { type: 'key', keys: ['accent'] }
      ])
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'bg:<~color|color>')).toMatchObject({
      kind: 'color',
      variableAliasRefs: ['~color'],
      matchers: expect.arrayContaining([
        { type: 'variable', keys: ['bg'] },
        { type: 'value', keys: ['bg'] }
      ])
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'fg:<~color-text|~color|color>')).toMatchObject({
      variableAliasRefs: ['~color-text', '~color']
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'user-select:<auto|none|text|all>')).toMatchObject({
      matchers: [{
        type: 'pattern',
        prefix: 'user-select:',
        values: ['auto', 'none', 'text', 'all']
      }]
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'line-clamp:<number|none>')).toMatchObject({
      kind: 'number',
      matchers: expect.arrayContaining([
        { type: 'value', keys: ['line-clamp'] },
        {
          type: 'pattern',
          prefix: 'line-clamp:',
          values: ['none']
        }
      ])
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'text:<~font-size|number>')).toMatchObject({
      kind: 'number',
      variableAliasRefs: ['~font-size'],
      emit: {
        type: 'static',
        rules: [{
          declarations: {
            'font-size': null,
            'line-height': [
              'max(1.8em - max(0rem, ',
              null,
              ' - 1rem) * 1.12, ',
              null,
              ')'
            ],
            'letter-spacing': [
              'clamp(-.072em, calc((',
              null,
              ' - 1rem) * -.048), 0em)'
            ]
          }
        }]
      }
    })
    expect(manifest.utilities?.find((utility) => utility.id === 'text-decoration:<~color|*>')).toMatchObject({
      variableAliasRefs: ['~color'],
      matchers: expect.arrayContaining([
        { type: 'variable', keys: ['text-decoration'] },
        { type: 'key', keys: ['text-decoration'] }
      ])
    })

    const css = createTestCSS(manifest)
    expect(css.createRule('font:sm')?.text).toBe('.font\\:sm{font-size:var(--font-size-sm)}')
    expect(css.createRule('font:sans')?.text).toBe('.font\\:sans{font-family:var(--font-family-sans)}')
    expect(css.createRule('font:bold')?.text).toBe('.font\\:bold{font-weight:var(--font-weight-bold)}')
    expect(css.createRule('font:1rem')?.text).toBe('.font\\:1rem{font-size:1rem}')
    expect(css.createRule('bg:red')?.text).toBe('.bg\\:red{background-color:var(--color-red)}')
    expect(css.createRule('bg:#fff')?.text).toBe('.bg\\:\\#fff{background-color:#fff}')
    expect(css.createRule('fg:red')?.text).toBe('.fg\\:red{color:var(--color-text-red)}')
    expect(css.createRule('grid-cols:3')?.text).toBe('.grid-cols\\:3{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr))}')
    expect(css.createRule('grid-cols:var(--cols)')?.text).toBe('.grid-cols\\:var\\(--cols\\){display:grid;grid-template-columns:repeat(var(--cols), minmax(0, 1fr))}')
    expect(css.createRule('grid-col-span:2')?.text).toBe('.grid-col-span\\:2{grid-column:span 2/span 2}')
    expect(css.createRule('grid-col-span:var(--span)')?.text).toBe('.grid-col-span\\:var\\(--span\\){grid-column:span var(--span)/span var(--span)}')
    expect(css.createRule('size:4x')?.text).toBe('.size\\:4x{width:1rem;height:1rem}')
    expect(css.createRule('size:4x|8x')?.text).toBe('.size\\:4x\\|8x{width:1rem 2rem;height:1rem 2rem}')
    expect(css.createRule('gap:var(--gap)')?.text).toBe('.gap\\:var\\(--gap\\){gap:var(--gap)}')
    expect(css.createRule('accent:var(--accent)')?.text).toBe('.accent\\:var\\(--accent\\){accent-color:var(--accent)}')
    expect(css.createRule('user-select:none')?.text).toBe('.user-select\\:none{-webkit-user-select:none;user-select:none}')
    expect(css.createRule('line-clamp:3')?.text).toBe('.line-clamp\\:3{-webkit-line-clamp:3}')
    expect(css.createRule('line-clamp:none')?.text).toBe('.line-clamp\\:none{-webkit-line-clamp:none}')
    expect(css.createRule('text-decoration:underline|red')?.text)
      .toBe('.text-decoration\\:underline\\|red{-webkit-text-decoration:underline var(--color-red);text-decoration:underline var(--color-red)}')
    expect(css.createRule('bg:cover')).toBeUndefined()
  })

  test('rejects unsupported managed enum pattern syntax', () => {
    expect(() => compileCSSManifest(`
      @utilities {
        x-<> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed enum pattern cannot be empty')

    expect(() => compileCSSManifest(`
      @utilities {
        x-<a> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed enum pattern requires at least two values separated by "|"')

    expect(() => compileCSSManifest(`
      @utilities {
        x-<a><b> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed pattern must contain exactly one <...> segment')

    expect(() => compileCSSManifest(`
      @utilities {
        font-<font-size> {
          font-size: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed enum pattern requires at least two values separated by "|"')

    expect(() => compileCSSManifest(`
      @utilities {
        x-<a,b> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed enum pattern values must use "|" separators')

    expect(() => compileCSSManifest(`
      @utilities {
        x-<a=span 1|b=b> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Invalid managed enum mapped value')

    expect(() => compileCSSManifest(`
      @utilities {
        x-<a|b> {
          color: --value(rem);
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('--value() does not accept arguments')

    expect(() => compileCSSManifest(`
      @utilities {
        x-<a|b> {
          color: --value()-box;
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('--value() must be a standalone CSS value placeholder')

    expect(() => compileCSSManifest(`
      @utilities {
        x-<a|b> {
          color: foo--value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('--value() must be a standalone CSS value placeholder')

    expect(() => compileCSSManifest(`
      @utilities {
        x-<around|between> {
          align-content: space---value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('--value() must be a standalone CSS value placeholder')

    expect(() => compileCSSManifest(`
      @utilities {
        text-center {
          text-align: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('--value() is only supported inside managed pattern declarations')
  })

  test('rejects unsupported managed dynamic colon syntax', () => {
    expect(() => compileCSSManifest(`
      @utilities {
        x:<> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed dynamic utility source list cannot be empty')

    expect(() => compileCSSManifest(`
      @utilities {
        x:<~> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Invalid managed dynamic utility namespace')

    expect(() => compileCSSManifest(`
      @utilities {
        x:<raw> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed dynamic utility enum source requires at least two values separated by "|"')

    expect(() => compileCSSManifest(`
      @utilities {
        x:<~color|none> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed dynamic utility enum values cannot be combined with namespaces')

    expect(() => compileCSSManifest(`
      @utilities {
        x:<color|none> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed dynamic utility enum values cannot be combined with namespaces')

    expect(() => compileCSSManifest(`
      @utilities {
        x:<*|none> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed dynamic utility wildcard cannot be combined with enum values')

    expect(() => compileCSSManifest(`
      @utilities {
        x:<number|none|*> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed dynamic utility wildcard cannot be combined with enum values')

    expect(() => compileCSSManifest(`
      @utilities {
        x:<number,color> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed dynamic utility source lists must use "|" separators')

    expect(() => compileCSSManifest(`
      @utilities {
        x:<number|color> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed dynamic utilities only support one raw value kind per entry')

    expect(() => compileCSSManifest(`
      @utilities {
        :<number> {
          color: --value();
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('Managed dynamic utilities must use key:<...> syntax')
  })

  test('does not consume @utility as a Master CSS directive', () => {
    const result = compileCSS(`
      @utility text-<left|right> {
        text-align: --value();
      }
    `, {
      preserveNativeCSS: false
    })

    expect(result.manifestInput.utilities).toBeUndefined()
  })

  test('lowers dark and light shorthand variant blocks like explicit variant blocks', () => {
    const settings = `
      @settings {
        mode-trigger: class;
        modes: light dark chrisma;
      }
    `
    const explicit = compileCSSManifest(`
      ${settings}

      @components {
        panel {
          @variant dark {
            color: white;
          }

          @variant light {
            color: black;
          }
        }
      }

      .card {
        @variant dark {
          @compose block;
          color: white;
        }
      }

      @variant light {
        .banner {
          @compose hidden;
        }
      }
    `, { baseManifest: defaultManifest })
    const shorthand = compileCSSManifest(`
      ${settings}

      @components {
        panel {
          @dark {
            color: white;
          }

          @light {
            color: black;
          }
        }
      }

      .card {
        @dark {
          @compose block;
          color: white;
        }
      }

      @light {
        .banner {
          @compose hidden;
        }
      }
    `, { baseManifest: defaultManifest })

    const explicitCSS = createTestCSS(explicit.manifest).ensureClassRules('panel')
    const shorthandCSS = createTestCSS(shorthand.manifest).ensureClassRules('panel')

    expect(shorthand.css).toBe(explicit.css)
    expect(shorthandCSS.componentsLayer.text).toBe(explicitCSS.componentsLayer.text)
    expect(shorthand.css).toContain('.dark .card{display:block;color:#fff}')
    expect(shorthand.css).toContain('.light .banner{display:none}')
    expect(shorthandCSS.componentsLayer.text).toContain('.dark .panel{color:#fff}')
    expect(shorthandCSS.componentsLayer.text).toContain('.light .panel{color:#000}')
  })

  test('keeps compose canonicalization rewrites output-equivalent', () => {
    const before = compileCSSManifest(`
      @settings {
        mode-trigger: class;
      }

      @components {
        btn {
          @compose text-align:center contain:content bg:blue-60:hover@sm block@dark;
        }
      }

      .card {
        @compose text-align:center contain:content bg:blue-60:hover@sm block@dark;
      }
    `, { baseManifest: defaultManifest })
    const after = compileCSSManifest(`
      @settings {
        mode-trigger: class;
      }

      @components {
        btn {
          @compose text-center;
          contain: content;

          &:hover {
            @variant sm {
              @compose bg:blue-60;
            }
          }

          @dark {
            @compose block;
          }
        }
      }

      .card {
        @compose text-center;
        contain: content;

        &:hover {
          @variant sm {
            @compose bg:blue-60;
          }
        }

        @dark {
          @compose block;
        }
      }
    `, { baseManifest: defaultManifest })

    expect(normalizeDeclarationOrder(after.css)).toBe(normalizeDeclarationOrder(before.css))
    expect(normalizeDeclarationOrder(createTestCSS(after.manifest).ensureClassRules('btn').componentsLayer.text))
      .toBe(normalizeDeclarationOrder(createTestCSS(before.manifest).ensureClassRules('btn').componentsLayer.text))
  })

  test('keeps base declarations before matching responsive declarations', () => {
    const { manifest } = compileCSSManifest(`
      @defaults {
        prose {
          @variant sm {
            :is(h1, h2, h3, h4, h5, h6) {
              @compose mt:2xl scroll-mt:100px;
            }
          }

          :is(h1, h2, h3, h4, h5, h6) {
            @compose mt:lg scroll-mt:60px;
          }
        }
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(manifest).ensureClassRules('prose')

    expect(css.defaultsLayer.text).toContain(
      '.prose :is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-lg);scroll-margin-top:60px}'
      + '@media (width>=52.125rem){.prose :is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-2xl);scroll-margin-top:100px}}'
    )
  })

  test('keeps custom modes explicit behind @variant', () => {
    const customMode = compileCSSManifest(`
      @settings {
        mode-trigger: class;
        modes: light dark chrisma;
      }

      .card {
        @variant chrisma {
          color: green;
        }
      }
    `, { baseManifest: defaultManifest })

    expect(customMode.css).toContain('.chrisma .card{color:green}')
    const bareCondition = compileCSSManifest(`
      @settings {
        mode-trigger: class;
        modes: light dark chrisma;
      }

      .card {
        @chrisma {
          color: green;
        }
      }
    `, { baseManifest: defaultManifest })

    expect(bareCondition.css).toContain('@chrisma')
    expect(bareCondition.css).not.toContain('.chrisma .card')
  })

  test('rejects legacy at-prefixed and selector variant directive syntax', () => {
    expect(() => compileCSSManifest(`
      @custom-variant @print {
        @media print {
          @slot;
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('@custom-variant uses bare condition variant names')

    expect(() => compileCSSManifest(`
      @custom-variant :interactive {
        &:hover {
          @slot;
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('@custom-variant only defines condition variants')

    expect(() => compileCSSManifest(`
      .card {
        @variant :interactive {
          color: blue;
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('@variant only applies condition variants')

    const result = compileCSSManifest(`
      @components {
        card {
          &:is(:hover, :focus-visible) {
            color: blue;
          }
        }
      }
    `, { baseManifest: defaultManifest })

    const css = createTestCSS(result.manifest)
    css.ensureClassRules('card')
    expect(css.componentsLayer.text).toContain('.card:is(:hover,:focus-visible){color:#00f}')
  })

})
