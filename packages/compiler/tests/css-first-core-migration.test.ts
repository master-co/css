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
      @mode light { .light { @slot; } }
      @mode dark { .dark { @slot; } }

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

      @utilities {
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
    expect(manifest.modes).toEqual([
      { name: 'light', branches: [{ selector: '.light' }] },
      { name: 'dark', branches: [{ selector: '.dark' }] }
    ])
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
    expect(manifest.utilities?.some((utility) => utility.name === 'btn' && utility.layer === 'utilities')).toBe(true)
    expect(manifest.utilities?.some((utility) => utility.name === 'content-auto' && utility.layer === 'utilities')).toBe(true)

    const css = createTestCSS(manifest)
    css.ensureClassRules('btn', 'content-auto', 'm-card')
    expect(css.themeLayer.text).toContain(':root,:host{--color-primary:#000;--spacing-card:1rem}')
    expect(css.themeLayer.text).toContain('.dark{--color-primary:#fff}')
    expect(css.utilitiesLayer.text).toContain('.btn{display:inline-flex;color:var(--color-primary)}')
    expect(css.utilitiesLayer.text).toContain('@media print{.btn{display:none}}')
    expect(css.utilitiesLayer.text).toContain('.btn:disabled>span{display:block}')
    expect(css.utilitiesLayer.text).toContain('.btn:nth-child(2n){display:grid}')
    expect(css.utilitiesLayer.text).toContain('.content-auto{content-visibility:auto}')
    expect(css.utilitiesLayer.text).toContain('.m-card{margin:var(--spacing-card)}')
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

      @utilities {
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
    expect(css.createRule('badge-success')?.layerName).toBe('utilities')
  })

  test('lowers separate named token and raw parameter entries', () => {
    const { manifest } = compileCSSManifest(`
      @theme {
        --font-size-sm: .875rem;
        --font-family-sans: ui-sans-serif;
        --font-weight-bold: 700;
        --color-red: red;
        --color-text-red: #900;
        --container-card: 20rem;
      }
      @utilities {
        font-<~font-size> { font-size: --value(); }
        font-<~font-family> { font-family: --value(); }
        font-<~font-weight> { font-weight: --value(); }
        font-size:<number> { font-size: --value(); }
        bg-<~color> { background-color: --value(); }
        fg-<~color-text|~color> { color: --value(); }
        grid-cols:<number|*> {
          display: grid;
          grid-template-columns: repeat(--value(), minmax(0, 1fr));
        }
        grid-col-span:<number|*> { grid-column: span --value()/span --value(); }
        size-<~container> { width: --value(); height: --value(); }
        size:<number|*> { width: --value(); height: --value(); }
        gap:<*|number> { gap: --value(); }
        accent:<color|*> { accent-color: --value(); }
        user-select:<auto|none|text|all> {
          -webkit-user-select: --value();
          user-select: --value();
        }
        clamp-lines:<number|none> { -webkit-line-clamp: --value(); }
        text-<~font-size> {
          font-size: --value();
          line-height: max(1.8em - max(0rem, --value() - 1rem) * 1.12, --value());
          letter-spacing: clamp(-0.072em, calc((--value() - 1rem) * -0.048), 0em);
        }
        text-decoration:<*> {
          -webkit-text-decoration: --value();
          text-decoration: --value();
        }
      }
    `)
    const utility = (id: string) => manifest.utilities?.find(utility => utility.id === id)
    expect(utility('font-<~font-size>')).toMatchObject({
      variableAliasRefs: ['~font-size'], matchers: [{ type: 'token', prefix: 'font-' }]
    })
    expect(utility('font-size:<number>')).toMatchObject({
      kind: 'number', matchers: [{ type: 'value', keys: ['font-size'] }]
    })
    expect(utility('size-<~container>')).toMatchObject({
      type: UtilityType.Shorthand, variableAliasRefs: ['~container'],
      matchers: [{ type: 'token', prefix: 'size-' }]
    })
    for (const key of ['grid-cols', 'grid-col-span', 'size']) {
      expect(utility(`${key}:<number|*>`)).toMatchObject({
        kind: 'number', matchers: [{ type: 'value', keys: [key] }, { type: 'key', keys: [key] }]
      })
    }
    expect(utility('accent:<color|*>')).toMatchObject({
      kind: 'color', matchers: [{ type: 'value', keys: ['accent'] }, { type: 'key', keys: ['accent'] }]
    })
    expect(utility('accent:<color|*>')).not.toHaveProperty('variableAliasRefs')
    expect(utility('user-select:<auto|none|text|all>')).toMatchObject({
      matchers: [{ type: 'pattern', prefix: 'user-select:', values: ['auto', 'none', 'text', 'all'] }]
    })
    expect(utility('text-<~font-size>')?.emit).toMatchObject({
      type: 'static', rules: [{ declarations: {
        'font-size': null,
        'line-height': ['max(1.8em - max(0rem, ', null, ' - 1rem) * 1.12, ', null, ')'],
        'letter-spacing': ['clamp(-.072em, calc((', null, ' - 1rem) * -.048), 0em)']
      } }]
    })
    const css = createTestCSS(manifest)
    const cases: [string, string][] = [
      ['font-sm', 'font-size:var(--font-size-sm)'],
      ['font-sans', 'font-family:var(--font-family-sans)'],
      ['font-bold', 'font-weight:var(--font-weight-bold)'],
      ['font-size:1rem', 'font-size:1rem'],
      ['bg-red', 'background-color:var(--color-red)'],
      ['fg-red', 'color:var(--color-text-red)'],
      ['grid-cols:3', 'display:grid;grid-template-columns:repeat(3, minmax(0, 1fr))'],
      ['grid-cols:var(--cols)', 'display:grid;grid-template-columns:repeat(var(--cols), minmax(0, 1fr))'],
      ['grid-col-span:2', 'grid-column:span 2/span 2'],
      ['grid-col-span:var(--span)', 'grid-column:span var(--span)/span var(--span)'],
      ['size:1rem', 'width:1rem;height:1rem'],
      ['size-card', 'width:var(--container-card);height:var(--container-card)'],
      ['size:1rem|2rem', 'width:1rem 2rem;height:1rem 2rem'],
      ['gap:var(--gap)', 'gap:var(--gap)'],
      ['accent:var(--accent)', 'accent-color:var(--accent)'],
      ['user-select:none', '-webkit-user-select:none;user-select:none'],
      ['clamp-lines:3', '-webkit-line-clamp:3'],
      ['clamp-lines:none', '-webkit-line-clamp:none'],
      ['text-decoration:underline|var(--color-red)', '-webkit-text-decoration:underline var(--color-red);text-decoration:underline var(--color-red)']
    ]
    for (const [className, declarations] of cases) expect(css.createRule(className)?.text).toContain(`{${declarations}}`)
    expect(css.createRule('accent:red')?.text).toContain('{accent-color:red}')
    expect(css.createRule('bg:cover')?.text).not.toContain('background-size')
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

    const nativeFunction = compileCSSManifest(`
      @utilities { text-center { text-align: --value(); } }
    `, { baseManifest: defaultManifest })
    expect(nativeFunction.manifest.utilities?.find(utility => utility.name === 'text-center')?.emit).toMatchObject({
      type: 'static', rules: [{ declarations: { 'text-align': '--value()' } }]
    })
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
    `, { baseManifest: defaultManifest })).toThrow('Token namespaces require named patterns')

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
    `, { baseManifest: defaultManifest })).toThrow('Token namespaces require named patterns')

    expect(() => compileCSSManifest(`
      @utilities {
        paint:<color|none> {
          fill: --value();
        }
      }
    `, { baseManifest: defaultManifest })).not.toThrow()

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
      @mode light { .light { @slot; } }
      @mode dark { .dark { @slot; } }
      @mode chrisma { .chrisma { @slot; } }
    `
    const explicit = compileCSSManifest(`
      ${settings}

      @utilities {
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

      @utilities {
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
    expect(shorthandCSS.utilitiesLayer.text).toBe(explicitCSS.utilitiesLayer.text)
    expect(shorthand.css).toContain('.card:where(.dark,.dark *){display:block;color:#fff}')
    expect(shorthand.css).toContain('.banner:where(.light,.light *){display:none}')
    expect(shorthandCSS.utilitiesLayer.text).toContain('.panel:where(.dark,.dark *){color:#fff}')
    expect(shorthandCSS.utilitiesLayer.text).toContain('.panel:where(.light,.light *){color:#000}')
  })

  test('keeps rewritten compose blocks in their authored condition order', () => {
    const before = compileCSSManifest(`
      @mode light { .light { @slot; } }
      @mode dark { .dark { @slot; } }

      @utilities {
        btn {
          @compose text-align:center contain:content bg-blue-60:hover@sm block@dark;
        }
      }

      .card {
        @compose text-align:center contain:content bg-blue-60:hover@sm block@dark;
      }
    `, { baseManifest: defaultManifest })
    const after = compileCSSManifest(`
      @mode light { .light { @slot; } }
      @mode dark { .dark { @slot; } }

      @utilities {
        btn {
          @compose text-center;
          contain: content;

          &:hover {
            @variant sm {
              @compose bg-blue-60;
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
            @compose bg-blue-60;
          }
        }

        @dark {
          @compose block;
        }
      }
    `, { baseManifest: defaultManifest })

    expect(after.css.indexOf('@media')).toBeLessThan(after.css.indexOf('.card:where(.dark'))
    expect(before.css.indexOf('.card:where(.dark')).toBeLessThan(before.css.indexOf('@media'))
    for (const result of [before, after]) {
      expect(result.css).toContain('text-align:center')
      expect(result.css).toContain('contain:content')
      expect(result.css).toContain('display:block')
      expect(result.css).toContain('background-color:var(--color-blue-60)')
    }
  })

  test('keeps authored responsive declarations before later base declarations', () => {
    const { manifest } = compileCSSManifest(`
      @utilities {
        prose {
          @variant sm {
            :is(h1, h2, h3, h4, h5, h6) {
              @compose mt-2xl scroll-mt:100px;
            }
          }

          :is(h1, h2, h3, h4, h5, h6) {
            @compose mt-lg scroll-mt:60px;
          }
        }
      }
    `, { baseManifest: defaultManifest })
    const css = createTestCSS(manifest).ensureClassRules('prose')

    expect(css.utilitiesLayer.text).toContain(
      '@media (width>=52.125rem){.prose :is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-2xl);scroll-margin-top:100px}}'
      + '.prose :is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-lg);scroll-margin-top:60px}'
    )
  })

  test('keeps custom modes explicit behind @variant', () => {
    const customMode = compileCSSManifest(`
      @mode light { .light { @slot; } }
      @mode dark { .dark { @slot; } }
      @mode chrisma { .chrisma { @slot; } }

      .card {
        @variant chrisma {
          color: green;
        }
      }
    `, { baseManifest: defaultManifest })

    expect(customMode.css).toContain('.card:where(.chrisma,.chrisma *){color:green}')
    const bareCondition = compileCSSManifest(`
      @mode light { .light { @slot; } }
      @mode dark { .dark { @slot; } }
      @mode chrisma { .chrisma { @slot; } }

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
      @utilities {
        card {
          &:is(:hover, :focus-visible) {
            color: blue;
          }
        }
      }
    `, { baseManifest: defaultManifest })

    const css = createTestCSS(result.manifest)
    css.ensureClassRules('card')
    expect(css.utilitiesLayer.text).toContain('.card:is(:hover,:focus-visible){color:#00f}')
  })

})
