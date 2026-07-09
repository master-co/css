import { describe, expect, test } from 'vitest'
import { MasterCSS } from '@master/css-engine'
import { compileCSS, compileCSSManifest } from '../src'
import type { CompilerDiagnosticRecorder } from '../src/diagnostics'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import UtilityType from '@master/css-schema/utility-type'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function variablesOf(manifest: MasterCSSManifest) {
  return flattenMasterCSSManifestVariables(manifest.variables)
}

function createTestCSS(manifest: MasterCSSManifest) {
  return MasterCSS.create({ manifest })
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

  test('keeps nested selectors aligned with native CSS descendant and compound behavior', () => {
    const result = compileCSSManifest(`
      @components {
        card {
          p {
            color: red;
          }

          :is(p, li) {
            color: blue;
          }

          & :is(code, kbd) {
            color: green;
          }

          &:hover {
            color: black;
          }
        }
      }
    `, { baseManifest: defaultManifest })

    const css = createTestCSS(result.manifest)
    css.ensureClassRules('card')
    expect(css.componentsLayer.text).toContain('.card p{color:red}')
    expect(css.componentsLayer.text).toContain('.card :is(p,li){color:#00f}')
    expect(css.componentsLayer.text).toContain('.card :is(code,kbd){color:green}')
    expect(css.componentsLayer.text).toContain('.card:hover{color:#000}')
  })

  test('replaces old JS merging intent with ordered CSS imports through baseManifest lowering', () => {
    const first = compileCSSManifest(`
      @components {
        a { order: 1; }
        b { order: 2; }
      }
    `, {
      baseManifest: defaultManifest
    })
    const second = compileCSSManifest(`
      @components {
        b { order: 22; }
        c { order: 3; }
      }
    `, {
      baseManifest: first.manifest
    })
    const css = createTestCSS(second.manifest)

    css.ensureClassRules('a', 'b', 'c')
    expect(css.componentsLayer.text).toContain('.a{order:1}')
    expect(css.componentsLayer.text).toContain('.b{order:22}')
    expect(css.componentsLayer.text).toContain('.c{order:3}')
    expect(css.componentsLayer.text).not.toContain('.b{order:2}')
  })

  test('lowers managed animations and removes them when no class references remain', () => {
    const { manifest } = compileCSSManifest(`
      @theme {
        --color-primary: #ff0;

        @keyframes fade {
          to {
            background: var(--color-primary);
          }
        }
      }

      @components {
        btn {
          animation: fade 1s;
        }
      }
    `, {
      baseManifest: defaultManifest
    })
    const css = createTestCSS(manifest)

    expect(manifest.animations?.fade).toEqual({
      to: {
        background: 'var(--color-primary)'
      }
    })
    css.ensureClassRules('btn')
    expect(css.themeLayer.text).toContain(':root{--color-primary:#ff0}')
    expect(css.animationsNonLayer.text).toContain('@keyframes fade{to{background:var(--color-primary)}}')
    css.deleteClassRules('btn')
    expect(css.themeLayer.text).toBe('')
    expect(css.animationsNonLayer.text).toBe('')
  })

  test('lowers class mode defaults without the old JS Config API', () => {
    const base = `
      @settings {
        mode-trigger: class;
        modes: light dark;
      }

      @theme light {
        --color-emphasis: #000;
      }

      @theme dark {
        --color-emphasis: #fff;
      }
    `

    const lightDefault = createTestCSS(compileCSSManifest(`
      @settings {
        default-mode: light;
      }

      ${base}
    `, { baseManifest: defaultManifest }).manifest).ensureClassRules('bg:emphasis')
    expect(lightDefault.themeLayer.text).toContain('.light,:root{color-scheme:light;--color-emphasis:#000}')
    expect(lightDefault.themeLayer.text).toContain('.dark{color-scheme:dark;--color-emphasis:#fff}')

    const noDefault = createTestCSS(compileCSSManifest(`
      @settings {
        default-mode: none;
      }

      ${base}
    `, { baseManifest: defaultManifest }).manifest).ensureClassRules('bg:emphasis')
    expect(noDefault.themeLayer.text).toContain('.light{color-scheme:light;--color-emphasis:#000}')
    expect(noDefault.themeLayer.text).not.toContain('.light,:root{--color-emphasis')
  })

  test('lowers color variables, mode values, aliases, and alpha references', () => {
    const { manifest } = compileCSSManifest(`
      @settings {
        mode-trigger: class;
        modes: light dark chrisma;
      }

      @theme {
        --color-black: #000000;
        --color-primary: #000000;
        --color-alias: var(--color-primary);
      }

      @theme light {
        --color-primary: hsl(0 0% 58.82%);
      }

      @theme dark {
        --color-primary: hsl(0 0% 100%);
      }

      @theme chrisma {
        --color-primary: --alpha(var(--color-black) / 50%);
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(manifest).ensureClassRules('bg:primary', 'bg:primary/.5', 'bg:alias')

    expect(css.themeLayer.text).toContain(':root{--color-primary:#000;--color-black:#000;--color-alias:var(--color-primary)}')
    expect(css.themeLayer.text).toContain('.light{color-scheme:light;--color-primary:#969696}')
    expect(css.themeLayer.text).toContain('.dark{color-scheme:dark;--color-primary:#fff}')
    expect(css.themeLayer.text).toContain('.chrisma{--color-primary:color-mix(in oklab,var(--color-black) 50%,transparent)}')
    expect(css.utilitiesLayer.text).toContain('.bg\\:primary{background-color:var(--color-primary)}')
    expect(css.utilitiesLayer.text).toContain('.bg\\:primary\\/\\.5{background-color:color-mix(in oklab,var(--color-primary) 50%,transparent)}')
    expect(css.utilitiesLayer.text).toContain('.bg\\:alias{background-color:var(--color-alias)}')
  })

  test('lowers stylesheet --alpha() in theme, managed declarations, and native CSS', () => {
    const result = compileCSSManifest(`
      @theme {
        --color-primary: #123456;
        --color-muted: --alpha(var(--color-primary) / 50%);
      }

      @components {
        btn {
          background-color: --alpha(var(--color-primary) / .5);
        }
      }

      .native {
        color: --alpha(var(--color-muted) / var(--opacity-muted));
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(result.manifest)

    css.ensureClassRules('btn', 'bg:muted')
    expect(css.themeLayer.text).toContain('--color-muted:color-mix(in oklab,var(--color-primary) 50%,transparent)')
    expect(css.componentsLayer.text).toContain('.btn{background-color:color-mix(in oklab,var(--color-primary) 50%,transparent)}')
    expect(result.nativeCSS).toContain('color: color-mix(in oklab,var(--color-muted) var(--opacity-muted),transparent);')
  })

  test('rejects stylesheet token alias syntax and invalid --alpha() alpha values', () => {
    expect(() => compileCSSManifest('@theme { --color-brand: $color-blue-60; }', { baseManifest: defaultManifest }))
      .toThrow('Replace "$color-blue-60" with "var(--color-blue-60)"')
    expect(() => compileCSSManifest('.native { color: $color-blue-60; }', { baseManifest: defaultManifest }))
      .toThrow('Replace "$color-blue-60" with "var(--color-blue-60)"')
    expect(() => compileCSSManifest('@theme { --color-brand: --alpha(var(--color-blue-60) / 50); }', { baseManifest: defaultManifest }))
      .toThrow('numeric alpha must be between 0 and 1')
    expect(() => compileCSSManifest('@theme { --color-brand: --alpha(var(--color-blue-60) / foo); }', { baseManifest: defaultManifest }))
      .toThrow('unsupported alpha value "foo"')
    expect(() => compileCSSManifest('@theme { --color-brand: --alpha(var(--color-blue-60) / 50% / 20%); }', { baseManifest: defaultManifest }))
      .toThrow('expected "<color> / <alpha>"')
    expect(() => compileCSSManifest('@theme { --color-brand: --alpha(var(--color-blue-60)); }', { baseManifest: defaultManifest }))
      .toThrow('expected "<color> / <alpha>"')
  })

  test('ignores quoted variable references while collecting theme dependencies', () => {
    const { manifest } = compileCSSManifest(`
      @theme {
        --content-demo: "var(--color-blue-60)";
        --color-blue-60: #3366ff;
      }
    `, { baseManifest: defaultManifest })

    const demo = variablesOf(manifest).find((variable) => variable.name === 'content-demo')
    expect(demo?.dependencies).toBeUndefined()
  })

  test('resolves built-in and utility-owned theme namespaces before lowering composed definitions', () => {
    const { manifest } = compileCSSManifest(`
      @theme {
        --content-stripe: 'stripe';
        --box-shadow-panel: 0 1px 2px #000;
        --shadow-panel: 0 1px 2px #000;
        --spacing-card: 1.5rem;
        --leading-body: 1.7;
        --color-line-brand: #abcdef;
        --color-brand: #123456;
        --color-primary: #123456;
      }

      @defaults {
        demo {
          @compose content:stripe;
        }
      }
    `, { baseManifest: defaultManifest })

    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'content-stripe',
      namespace: 'content',
      key: 'stripe'
    }))
    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'box-shadow-panel',
      key: 'box-shadow-panel'
    }))
    expect(variablesOf(manifest)).not.toContainEqual(expect.objectContaining({
      name: 'box-shadow-panel',
      namespace: 'box-shadow'
    }))
    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'shadow-panel',
      namespace: 'shadow',
      key: 'panel'
    }))
    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'spacing-card',
      namespace: 'spacing',
      key: 'card'
    }))
    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'leading-body',
      namespace: 'leading',
      key: 'body'
    }))
    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'color-line-brand',
      namespace: 'color-line',
      key: 'brand'
    }))

    const css = createTestCSS(manifest)
    expect(css.createRule('content:stripe')?.text).toBe('.content\\:stripe{content:var(--content-stripe)}')
    expect(css.createRule('shadow:panel')?.text).toBe('.shadow\\:panel{box-shadow:var(--shadow-panel)}')
    expect(css.createRule('p:card')?.text).toBe('.p\\:card{padding:var(--spacing-card)}')
    expect(css.createRule('gap:card')?.text).toBe('.gap\\:card{gap:var(--spacing-card)}')
    expect(css.createRule('m:card')?.text).toBe('.m\\:card{margin:var(--spacing-card)}')
    expect(css.createRule('leading:body')?.text).toBe('.leading\\:body{line-height:var(--leading-body)}')
    expect(css.createRule('line-height:body')?.text).toBe('.line-height\\:body{line-height:var(--leading-body)}')
    expect(css.createRule('b:brand')?.text).toBe('.b\\:brand{border-color:var(--color-line-brand)}')
    expect(css.createRule('bg:brand')?.text).toBe('.bg\\:brand{background-color:var(--color-brand)}')
    expect(css.createRule('bg:primary')?.text).toBe('.bg\\:primary{background-color:var(--color-primary)}')
    expect(css.createRule('shadow:sm')?.text).toBe('.shadow\\:sm{box-shadow:var(--shadow-sm)}')

    css.ensureClassRules('demo')
    expect(css.defaultsLayer.text).toContain('.demo{content:var(--content-stripe)}')
    expect(css.themeLayer.text).toContain('--content-stripe:"stripe"')
  })

  test('lowers unquoted compose class lists from raw source', () => {
    const result = compileCSSManifest(`
      @theme {
        --color-primary: #123456;
      }

      @components {
        card {
          @compose inline-flex bg:primary/.9 opacity:.7 translate:-5px;
        }
      }

      .list {
        @compose text-center>li;
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(result.manifest)

    css.ensureClassRules('card')

    expect(result.directives.styleDefinitions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'compose',
        className: 'bg:primary/.9'
      }),
      expect.objectContaining({
        type: 'compose',
        className: 'translate:-5px'
      }),
      expect.objectContaining({
        type: 'compose',
        className: 'opacity:.7'
      }),
      expect.objectContaining({
        type: 'compose',
        className: 'text-center>li'
      })
    ]))
    expect(css.text).toContain('.card')
    expect(css.text).toContain('display:inline-flex')
    expect(css.text).toContain('background-color:color-mix(in oklab,var(--color-primary) 90%,transparent)')
    expect(css.text).toContain('opacity:0.7')
    expect(css.text).toContain('translate:-5px')
    expect(result.css).toContain('.list>li{text-align:center}')
  })

  test('batches independent managed style refreshes before native compose', () => {
    const { result, diagnostics } = compileCSSManifestWithDiagnostics(`
      @components {
        alpha {
          color: red;
        }

        beta {
          background: blue;
        }
      }

      .card {
        @compose alpha beta;
      }
    `)

    expect(result.css).toContain('.card{color:red;background:#00f}')
    expect(diagnostics.counts['lower-managed-style-refresh-count']).toBe(1)
  })

  test('refreshes once before a managed compose dependency', () => {
    const { result, diagnostics } = compileCSSManifestWithDiagnostics(`
      @components {
        alpha {
          color: red;
        }

        beta {
          @compose alpha;
          background: blue;
        }
      }
    `)
    const css = createTestCSS(result.manifest)

    css.ensureClassRules('beta')
    expect(css.componentsLayer.text).toContain('.beta{color:red;background:#00f}')
    expect(diagnostics.counts['lower-managed-style-refresh-count']).toBe(1)
  })

  test('refreshes once for a multi-dependency managed compose group', () => {
    const { result, diagnostics } = compileCSSManifestWithDiagnostics(`
      @components {
        alpha {
          color: red;
        }

        beta {
          background: blue;
        }

        gamma {
          @compose alpha beta;
          border-color: green;
        }
      }
    `)
    const css = createTestCSS(result.manifest)

    css.ensureClassRules('gamma')
    expect(css.componentsLayer.text).toContain('.gamma{color:red;background:#00f;border-color:green}')
    expect(diagnostics.counts['lower-managed-style-refresh-count']).toBe(1)
  })

  test('refreshes pending managed definitions before native compose', () => {
    const { result, diagnostics } = compileCSSManifestWithDiagnostics(`
      @components {
        alpha {
          color: red;
        }

        beta {
          @compose alpha;
          background: blue;
        }
      }

      .card {
        @compose beta;
      }
    `)

    expect(result.css).toContain('.card{color:red;background:#00f}')
    expect(diagnostics.counts['lower-managed-style-refresh-count']).toBe(2)
  })

  test('rejects quoted and grouped compose class lists', () => {
    const expectComposeError = (source: string, code: string) => {
      let error: unknown
      try {
        compileCSSManifest(source, { baseManifest: defaultManifest })
      } catch (caught) {
        error = caught
      }
      expect(error).toMatchObject({ code })
    }

    expectComposeError('.card { @compose "block"; }', 'compose-quoted-syntax')
    expectComposeError('.card { @compose content:\'-\'; }', 'compose-quoted-syntax')
    expectComposeError('.card { @compose {text-center;block}>li; }', 'compose-group-syntax')
  })

  test('executes CSS-first number variables and native value functions through engine semantics', () => {
    const { manifest } = compileCSSManifest(`
      @settings {
        mode-trigger: class;
        modes: light dark;
      }

      @theme {
        --spacing-x1: 1rem;
        --container-custom: 15rem;
        --leading-x1: 1.5;
      }

      @theme light {
        --spacing-x1: 3rem;
        --leading-x1: 3;
      }

      @theme dark {
        --spacing-x1: 2rem;
        --leading-x1: 2;
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(manifest)

    expect(css.createRule('m:x1')?.text).toBe('.m\\:x1{margin:var(--spacing-x1)}')
    expect(css.createRule('m:var(--spacing-x1)')?.text).toBe('.m\\:var\\(--spacing-x1\\){margin:var(--spacing-x1)}')
    expect(css.createRule('m:$(spacing-x1)')).toBeUndefined()
    expect(css.createRule('line-height:x1')?.text).toBe('.line-height\\:x1{line-height:var(--leading-x1)}')
    expect(css.createRule('w:-custom')?.text).toBe('.w\\:-custom{width:calc(var(--container-custom) * -1)}')
    expect(css.createRule('w:calc(-2px+var(--spacing-x1))')?.text).toBe('.w\\:calc\\(-2px\\+var\\(--spacing-x1\\)\\){width:calc(-2px + var(--spacing-x1))}')
    expect(css.createRule('w:calc(-2px+$(spacing-x1))')).toBeUndefined()

    css.ensureClassRules('m:x1', 'm:-x1', 'line-height:x1')
    expect(css.themeLayer.text).toContain(':root{')
    expect(css.themeLayer.text).toContain('--spacing-x1:1rem')
    expect(css.themeLayer.text).not.toContain('---spacing-x1')
    expect(css.themeLayer.text).toContain('--leading-x1:1.5')
    expect(css.themeLayer.text).toContain('.light{color-scheme:light;--spacing-x1:3rem;--leading-x1:3}')
    expect(css.themeLayer.text).toContain('.dark{color-scheme:dark;--spacing-x1:2rem;--leading-x1:2}')
  })

  test('executes CSS-first unitful numeric variables without double conversion', () => {
    const { manifest } = compileCSSManifest(`
      @theme {
        --spacing-card: 1.5rem;
        --radius-card: 8px;
        --breakpoint-card: 48rem;
        --container-panel: 512px;
        --shadow-card: 1rem;
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(manifest)

    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'spacing-card',
      type: 'number',
      value: '1.5rem',
      numeric: { value: 1.5, unit: 'rem' }
    }))
    expect(variablesOf(manifest).find((variable) => variable.name === 'shadow-card')).toMatchObject({
      type: 'string',
      value: '1rem'
    })
    expect(manifest.breakpointConditions?.card).toMatchObject({
      id: 'media',
      nodes: [expect.objectContaining({ value: 48, unit: 'rem' })]
    })
    expect(manifest.containerConditions?.panel).toMatchObject({
      id: 'container',
      nodes: [expect.objectContaining({ value: 32, unit: 'rem' })]
    })
    expect(css.createRule('m:card')?.text).toBe('.m\\:card{margin:var(--spacing-card)}')
    expect(css.createRule('m:-card')?.text).toBe('.m\\:-card{margin:calc(var(--spacing-card) * -1)}')
    expect(css.createRule('r:card')?.text).toBe('.r\\:card{border-radius:var(--radius-card)}')
    expect(css.createRule('block@card')?.text).toContain('@media (width>=48rem)')
  })

  test('lowers inline theme variables without emitting their own theme rules', () => {
    const { manifest } = compileCSSManifest(`
      @theme inline {
        --color-primary: #123;
        --spacing-card: 1rem;
        --color-brand: var(--color-primary);
      }

      @theme {
        --color-regular: #456;
        --color-inline-regular: var(--color-regular);
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(manifest)

    css.ensureClassRules('bg:primary', 'fg:brand', 'm:card', 'fg:inline-regular')
    expect(css.utilitiesLayer.text).toContain('.bg\\:primary{background-color:#123}')
    expect(css.utilitiesLayer.text).toContain('.fg\\:brand{color:#123}')
    expect(css.utilitiesLayer.text).toContain('.m\\:card{margin:1rem}')
    expect(css.utilitiesLayer.text).toContain('.fg\\:inline-regular{color:var(--color-inline-regular)}')
    expect(css.themeLayer.text).toContain(':root{--color-inline-regular:var(--color-regular);--color-regular:#456}')
    expect(css.themeLayer.text).not.toContain('--color-primary:#123')
    expect(css.themeLayer.text).not.toContain('--spacing-card:1rem')
  })

  test('lowers static theme variables and keyframes into initial resources', () => {
    const { manifest } = compileCSSManifest(`
      @settings {
        mode-trigger: class;
        modes: light dark;
      }

      @theme static {
        --color-primary: #123;

        @keyframes fade {
          to {
            opacity: 1;
          }
        }
      }

      @theme dark static {
        --color-primary: #456;
      }

      @theme static light {
        --color-secondary: #789;
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(manifest)

    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'color-primary',
      static: true,
      value: '#123',
      modes: {
        dark: {
          type: 'string',
          value: '#456'
        }
      }
    }))
    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'color-secondary',
      static: true,
      modes: {
        light: {
          type: 'string',
          value: '#789'
        }
      }
    }))
    expect(manifest.animationOptions?.fade).toEqual({ static: true })
    expect(css.text).toContain('@layer theme{')
    expect(css.text).toContain(':root{--color-primary:#123}')
    expect(css.text).toContain('.dark{color-scheme:dark;--color-primary:#456}')
    expect(css.text).toContain('.light,:root{color-scheme:light;--color-secondary:#789}')
    expect(css.text).toContain('@keyframes fade{to{opacity:1}}')
  })

  test('rejects invalid static theme modifier combinations', () => {
    expect(() => compileCSSManifest(`
      @theme inline static {
        --color-primary: #123;
      }
    `, { baseManifest: defaultManifest })).toThrow('@theme inline and static cannot be combined')

    expect(() => compileCSSManifest(`
      @theme static inline {
        --color-primary: #123;
      }
    `, { baseManifest: defaultManifest })).toThrow('@theme inline and static cannot be combined')

    expect(() => compileCSSManifest(`
      @theme static static {
        --color-primary: #123;
      }
    `, { baseManifest: defaultManifest })).toThrow('@theme static modifier cannot be repeated')

    expect(() => compileCSSManifest(`
      @theme dark light static {
        --color-primary: #123;
      }
    `, { baseManifest: defaultManifest })).toThrow('@theme mode must be a single token')

    expect(() => compileCSSManifest(`
      @theme static dark {
        @keyframes fade {
          to {
            opacity: 1;
          }
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('@theme keyframes cannot be mode-specific or inline')
  })

  test('rejects mode-specific inline theme variables in CSS source', () => {
    expect(() => compileCSSManifest(`
      @theme dark inline {
        --color-primary: #123;
      }
    `, { baseManifest: defaultManifest })).toThrow('@theme inline cannot be mode-specific')

    expect(() => compileCSSManifest(`
      @theme inline dark {
        --color-primary: #123;
      }
    `, { baseManifest: defaultManifest })).toThrow('@theme inline cannot be mode-specific')
  })

  test('rejects mode-specific and inline managed keyframes in theme blocks', () => {
    expect(() => compileCSSManifest(`
      @theme dark {
        @keyframes fade {
          to {
            opacity: 1;
          }
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('@theme keyframes cannot be mode-specific or inline')

    expect(() => compileCSSManifest(`
      @theme inline {
        @keyframes fade {
          to {
            opacity: 1;
          }
        }
      }
    `, { baseManifest: defaultManifest })).toThrow('@theme keyframes cannot be mode-specific or inline')
  })

  test('normalizes CSS color functions and preserves alpha alias dependencies through CSS-first lowering', () => {
    const { manifest } = compileCSSManifest(`
      @theme {
        --color-rgb: rgb(0 128 255);
        --color-hsl-modern: hsl(210 100% 50%);
        --color-hsl-legacy: hsl(210, 100%, 50%);
        --color-hwb: hwb(210 30% 20%);
        --color-lab: lab(50% 40 -30);
        --color-lch: lch(50% 60 200);
        --color-oklab-demo: oklab(0.5 0.1 -0.05);
        --color-oklch-primary: oklch(0.5 0.15 240);
        --color-display-p3: color(display-p3 0.2 0.4 0.8);
        --color-color-srgb: color(srgb 0.2 0.4 0.8);
        --color-color-rec2020: color(rec2020 0.2 0.4 0.8);
        --color-soft: --alpha(var(--color-oklch-primary) / .3);
        --color-mix-demo: color-mix(in oklch, red, blue);
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(manifest)

    css.ensureClassRules(
      'bg:rgb',
      'bg:hsl-modern',
      'bg:hsl-legacy',
      'bg:hwb',
      'bg:lab',
      'bg:lch',
      'bg:oklab-demo',
      'bg:display-p3',
      'bg:color-srgb',
      'bg:color-rec2020',
      'bg:soft',
      'bg:mix-demo'
    )
    expect(css.themeLayer.text).toContain('--color-rgb:#0080ff')
    expect(css.themeLayer.text).toContain('--color-hsl-modern:#0080ff')
    expect(css.themeLayer.text).toContain('--color-hsl-legacy:#0080ff')
    expect(css.themeLayer.text).toContain('--color-hwb:#4d8ccc')
    expect(css.themeLayer.text).toContain('--color-lab:lab(50% 40 -30)')
    expect(css.themeLayer.text).toContain('--color-lch:lch(50% 60 200)')
    expect(css.themeLayer.text).toContain('--color-oklab-demo:oklab(50% .1 -.05)')
    expect(css.themeLayer.text).toContain('--color-display-p3:color(display-p3 .2 .4 .8)')
    expect(css.themeLayer.text).toContain('--color-color-srgb:color(srgb .2 .4 .8)')
    expect(css.themeLayer.text).toContain('--color-color-rec2020:color(rec2020 .2 .4 .8)')
    expect(css.themeLayer.text).toContain('--color-soft:color-mix(in oklab,var(--color-oklch-primary) 30%,transparent)')
    expect(css.themeLayer.text).toContain('--color-oklch-primary:oklch(50% .15 240)')
    expect(css.themeLayer.text).toContain('--color-mix-demo:oklch(')
    expect(css.utilitiesLayer.text).toContain('.bg\\:soft{background-color:var(--color-soft)}')
  })
})
