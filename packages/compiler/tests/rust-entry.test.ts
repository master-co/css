import { beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadNativeBinding } from '@master/css-native'
import { compileCSS, inspectCSS, resolveCSSImportGraph } from '../src'
import { createMasterCSSManifest } from '../src/master-css-manifest'

function getNativeDiagnostic(source: string) {
  const binding = loadNativeBinding({ required: true })!.binding
  try {
    binding.compileCssDirectivesJson(source)
  } catch (error) {
    return JSON.parse((error as Error).message) as {
      code: string
      message: string
      range?: { start: number, end: number }
    }
  }
  throw new Error('Expected native compiler to reject the source')
}

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

describe('Rust compiler entry inspection differential', () => {
  const stylesheets = [
    '@master entry;',
    '@master;',
    '@master global;',
    '@import "@master/css";',
    '@import url("@master/css") layer(theme);',
    '.x { content: "@import \\\"@master/css\\\";" }',
    '😀 { color:red }\n@master entry;'
  ]

  for (const [index, source] of stylesheets.entries()) {
    it(`matches entry fixture ${index + 1}`, () => {
      const binding = loadNativeBinding({ required: true })!.binding
      expect(JSON.parse(binding.inspectCssJson(source))).toEqual(inspectCSS(source))
    })
  }
})

describe('Rust native CSS compilation differential', () => {
  const stylesheets = [
    '@master entry;\n.card { color: red; }',
    '.card { color: color(display-p3 1 0 0); margin: 0px 1.0rem; }',
    '@media (width >= 40rem) { .card:hover { display: flex; } }',
    '/* keep */\n@supports (display: grid) { .grid { display: grid } }'
  ]

  for (const [index, source] of stylesheets.entries()) {
    it(`matches native stylesheet fixture ${index + 1}`, () => {
      const binding = loadNativeBinding({ required: true })!.binding
      const rust = JSON.parse(binding.compileNativeCssJson(source)) as {
        css: string
        nativeCSS: string
      }
      const oracle = compileCSS(source)
      expect(rust.nativeCSS).toBe(oracle.nativeCSS)
      expect(rust.css).toBe(oracle.css)
    })
  }

  it('matches preserveNativeCSS false', () => {
    const source = '.card { color: red; }'
    const binding = loadNativeBinding({ required: true })!.binding
    const rust = JSON.parse(binding.compileNativeCssJson(source, JSON.stringify({
      preserveNativeCSS: false
    }))) as { css: string, nativeCSS: string }
    const oracle = compileCSS(source, { preserveNativeCSS: false })
    expect(rust.nativeCSS).toBe(oracle.nativeCSS)
    expect(rust.css).toBe(oracle.css)
  })
})

describe('Rust settings/theme directive lowering differential', () => {
  const stylesheets = [
    '@theme { --color-brand: #123456; --leading-tight: 1.25; }',
    '@theme dark static { --color-brand: #fff; }',
    '@theme inline { --spacing-card: 1rem; }',
    '@theme { --color-brand: rgb(0 128 255); }\n.card { color: red; }',
    '@theme { --color-brand: #111; --color-accent: #222; }\n@theme { --color-brand: #333; }',
    '/* 😀 */\n@theme light { --content-demo: "hello"; }',
    `@theme static {
      --color-brand: #123;
      @keyframes fade {
        from, 50% { opacity: 0; transform: translateX(0px); }
        to { opacity: 1 !important; }
      }
    }`,
    `@theme {
      --color-rgb: rgb(0 128 255);
      --color-hsl: hsl(210, 100%, 50%);
      --color-muted: --alpha(var(--color-rgb) / .5);
      --content-quoted: "a | b";
      --content-piped: a | b;
    }`,
    `@settings {
      root-size: 16;
      base-unit: 1;
      default-mode: light;
      mode-trigger: class;
      important: on;
      modes: light, dark chrisma;
      scope: .app;
    }`
  ]

  for (const [index, source] of stylesheets.entries()) {
    it(`matches theme fixture ${index + 1}`, () => {
      const binding = loadNativeBinding({ required: true })!.binding
      const rust = JSON.parse(binding.compileCssDirectivesJson(source))
      expect(rust).toEqual(compileCSS(source))
    })
  }

  it.each([
    ['@theme dark inline { --color-brand: #fff; }', '@theme inline cannot be mode-specific'],
    ['@theme inline static { --color-brand: #fff; }', '@theme inline and static cannot be combined'],
    ['@theme static static { --color-brand: #fff; }', '@theme static modifier cannot be repeated'],
    ['@theme { color: red; }', '@theme token declarations must be CSS custom properties: color'],
    ['@theme { --color-brand: #fff !important; }', '@theme token declarations cannot be !important: color-brand'],
    ['@theme dark { @keyframes fade { to { opacity: 1; } } }', '@theme keyframes cannot be mode-specific or inline'],
    ['$color-blue-60', 'Replace "$color-blue-60" with "var(--color-blue-60)"'],
    ['--alpha(var(--color-blue-60) / 50)', 'numeric alpha must be between 0 and 1'],
    ['--alpha(var(--color-blue-60) / foo)', 'unsupported alpha value "foo"'],
    ['--alpha(var(--color-blue-60) / 50% / 20%)', 'expected "<color> / <alpha>"'],
    ['--alpha(var(--color-blue-60))', 'expected "<color> / <alpha>"'],
    ['@settings { base-unit: .25; }', 'base-unit must be a number'],
    ['@settings { mode-trigger: attribute; }', 'mode-trigger must be class, media, or host'],
    ['@settings { important: yes; }', 'important must be on or off'],
    ['@settings { unknown-option: yes; }', 'Unsupported @settings option: unknown-option'],
    ['@settings { root-size: 16 !important; }', '@settings does not accept !important declarations: root-size']
  ])('matches rejection for %s', (source, message) => {
    if (!source.startsWith('@')) source = `@theme { --color-brand: ${source}; }`
    const diagnostic = getNativeDiagnostic(source)
    expect(diagnostic.code).toBe('CSS_DIRECTIVE_ERROR')
    expect(diagnostic.message).toContain(message)
    expect(() => compileCSS(source)).toThrow(message)
  })
})

describe('Rust static managed directive lowering differential', () => {
  const stylesheets = [
    '/* 😀 */ @reference "./tokens.css";',
    `@custom-variant print { @media print { @slot; } }
    @custom-variant hocus { &:hover, &:focus { @slot; } }
    @custom-variant elevated {
      @layer components {
        @supports (display: grid) { @slot; }
      }
    }`,
    '@components { btn { display: inline-flex; color: red; } }',
    `@components {
      btn {
        display: inline-flex;
        &:disabled > span { display: block; }
        &:even { display: grid; }
        color: red;
      }
    }`,
    `@components {
      @media print {
        btn { display: none; }
      }
      card {
        @supports (display: grid) { display: grid; }
        @container panel (width > 20rem) {
          &:hover { color: red; }
        }
        @starting-style { opacity: 0; }
      }
    }`,
    `@components {
      @variant print {
        print-card { display: block; }
      }
      btn {
        @variant print { display: none; }
        &:hover { color: red; }
      }
    }`,
    `@components {
      btn {
        @dark { color: white; }
        @light { color: black; }
      }
    }`,
    `@components {
      btn {
        @compose flex fg:red 😀utility;
        color: red;
        &:hover { @compose opacity:50; }
        @variant print { @compose hidden; }
      }
    }`,
    '@utilities { content-auto { content-visibility: auto; } }',
    '@defaults { prose { margin: 0; } }',
    `@utilities {
      text-<left|right|center> { text-align: --value(); }
      bg-origin-<border=border-box|content=content-box> { background-origin: --value(); }
      font:<~font-size|number> { font-size: --value(); }
      grid-cols:<number|*> { grid-template-columns: repeat(--value(), minmax(0, 1fr)); }
    }`,
    `@components {
      badge-<success|danger> {
        color: --value();
        &:hover { opacity: .8; }
        @variant print { display: none; }
      }
    }`,
    `/* 😀 */
@components {
  btn { display: inline-flex; color: red; }
}
@utilities { content-auto { content-visibility: auto; } }`
  ]

  it.each(stylesheets)('matches static managed fixture %#', (source) => {
    const binding = loadNativeBinding({ required: true })!.binding
    const rust = JSON.parse(binding.compileCssDirectivesJson(source))
    expect(rust).toEqual(compileCSS(source))
  })

  it('matches standalone extraction policy and preserves wildcard regex wire semantics', () => {
    const source = `
      @source "src/**/*.{html,ts}";
      @source not "vendor/**";
      @safelist "flex fg:red";
      @blocklist "debug exact-class";
      @blocklist "legacy-*";
      @preserve native;
    `
    const binding = loadNativeBinding({ required: true })!.binding
    const rust = JSON.parse(binding.compileCssDirectivesJson(source))
    const oracle = compileCSS(source)
    expect(rust.extractionPolicy).toEqual({
      ...oracle.extractionPolicy,
      blocklist: [
        'debug',
        'exact-class',
        { source: (oracle.extractionPolicy.blocklist[2] as RegExp).source, flags: '' }
      ]
    })
    expect({ ...rust, extractionPolicy: oracle.extractionPolicy }).toEqual(oracle)
  })
})

describe('Rust provider-neutral import graph differential', () => {
  it('matches the Node filesystem host after resources and edges are prepared', () => {
    const root = mkdtempSync(join(tmpdir(), 'mastercss-rust-graph-'))
    const entry = join(root, 'entry.css')
    const theme = join(root, 'theme.css')
    const utilities = join(root, 'utilities.css')
    try {
      writeFileSync(entry, '@import "./theme.css";\n@import "https://example.com/font.css";\n.entry{display:block}')
      writeFileSync(theme, '@reference "./tokens.css";\n@import "./utilities.css";\n@theme{--color-brand:red}')
      writeFileSync(utilities, '@utilities{block{display:block}}')
      const oracle = resolveCSSImportGraph(entry)
      const binding = loadNativeBinding({ required: true })!.binding
      const rust = JSON.parse(binding.resolveCssImportGraphJson(JSON.stringify({
        entry,
        files: {
          [entry]: '@import "./theme.css";\n@import "https://example.com/font.css";\n.entry{display:block}',
          [theme]: '@reference "./tokens.css";\n@import "./utilities.css";\n@theme{--color-brand:red}',
          [utilities]: '@utilities{block{display:block}}'
        },
        edges: [
          { from: entry, specifier: './theme.css', resolved: theme },
          { from: theme, specifier: './utilities.css', resolved: utilities }
        ]
      })))
      expect(rust).toEqual(oracle)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe('Rust default preset directive input differential', () => {
  it('matches every directive used by the default preset', () => {
    const source = ['base.css', 'theme.css', 'variants.css', 'utilities.css']
      .map((file) => readFileSync(new URL(`../../preset/src/${file}`, import.meta.url), 'utf8'))
      .join('\n')
    const binding = loadNativeBinding({ required: true })!.binding
    const rust = JSON.parse(binding.compileCssDirectivesJson(source))
    const oracle = compileCSS(source)

    expect(rust.manifestInput).toEqual(oracle.manifestInput)
  })

  it('compiles and normalizes the checked-in default manifest byte for byte', () => {
    const source = ['base.css', 'theme.css', 'variants.css', 'utilities.css']
      .map((file) => readFileSync(new URL(`../../preset/src/${file}`, import.meta.url), 'utf8'))
      .join('\n')
    const binding = loadNativeBinding({ required: true })!.binding
    const directives = JSON.parse(binding.compileCssDirectivesJson(source))
    const { json } = JSON.parse(binding.compileDefaultPresetManifestJson(JSON.stringify({
      manifestInput: directives.manifestInput,
      styleDefinitions: directives.styleDefinitions
    })))

    expect(json).toBe(readFileSync(new URL('../../preset/src/default-manifest.json', import.meta.url), 'utf8'))
  })
})

describe('Rust Manifest v1 compilation differential', () => {
  const inputs = [
    {
      variables: [
        { namespace: 'spacing', key: 'card', value: 12, static: true },
        { namespace: 'color', key: 'brand', value: 'var(--color-blue-50)' },
        { namespace: 'color', key: 'brand', value: '#123', mode: 'dark', static: true }
      ]
    },
    {
      variables: [
        { namespace: 'spacing', key: 'card', value: '1.5rem' },
        { namespace: 'radius', key: 'card', value: '8px' },
        { namespace: 'breakpoint', key: 'card', value: '48rem' },
        { namespace: 'container', key: 'panel', value: '512px' },
        { namespace: 'shadow', key: 'card', value: '1rem' }
      ]
    },
    {
      variants: [
        { token: ':hocus', branches: [{ selector: '&:hover,&:focus' }] },
        { token: '@motion-safe', branches: [{ conditions: ['@media (prefers-reduced-motion:no-preference)'] }] },
        { token: '@component', branches: [{ layer: 'components' }] }
      ]
    },
    {
      utilities: [
        {
          name: 'card',
          layer: 'components',
          declarations: { display: 'grid', color: 'var(--color-primary)' }
        },
        {
          name: 'text-<left|right>',
          type: 'pattern',
          pattern: { prefix: 'text-', values: ['left', 'right'] },
          declarations: { 'text-align': '--value()' }
        },
        {
          name: 'gap:<~spacing|number|*>',
          type: 'dynamic',
          dynamic: {
            key: 'gap',
            variableAliasRefs: ['~spacing'],
            kind: 'number',
            arbitrary: true
          },
          declarations: { gap: '--value()' }
        }
      ]
    },
    {
      rootSize: 16,
      baseUnit: 4,
      defaultMode: 'light',
      modeTrigger: 'class',
      scope: '.app',
      important: true,
      modes: ['light', 'dark'],
      animations: { fade: { to: { opacity: '1' } } },
      animationOptions: { fade: { static: true } }
    }
  ]

  it.each(inputs)('matches manifest input fixture %#', (input) => {
    const binding = loadNativeBinding({ required: true })!.binding
    const rust = JSON.parse(binding.compileManifestInputJson(JSON.stringify(input))).manifest
    expect(rust).toEqual(createMasterCSSManifest(input as Parameters<typeof createMasterCSSManifest>[0]))
  })

  it('matches base manifest merging', () => {
    const baseManifest = createMasterCSSManifest({
      variables: [{ namespace: 'color', key: 'brand', value: 'red' }],
      utilities: [{ name: 'block', declarations: { display: 'block' } }]
    })
    const input = {
      variables: [
        { namespace: 'color', key: 'brand', value: 'blue' },
        { namespace: 'spacing', key: 'card', value: '1rem' }
      ],
      utilities: [{ name: 'flex', declarations: { display: 'flex' } }]
    }
    const binding = loadNativeBinding({ required: true })!.binding
    const rust = JSON.parse(binding.compileManifestInputJson(
      JSON.stringify(input),
      JSON.stringify({ baseManifest })
    )).manifest
    expect(rust).toEqual(createMasterCSSManifest(input, { baseManifest }))
  })
})
