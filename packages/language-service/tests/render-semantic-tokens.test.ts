import { expect, test } from 'vitest'

import CSSLanguageService from './helpers/rc87-language-service'
import createDoc from '../src/utils/create-doc'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '@master/css-tooling/language'
import { createPresetManifest } from './helpers/create-preset-manifest'

function decodeSemanticTokenRanges(doc: ReturnType<typeof createDoc>, data: number[]) {
  const tokens: { text: string, start: number, end: number, type: string, modifiers: string[] }[] = []
  let line = 0
  let character = 0
  for (let i = 0; i < data.length; i += 5) {
    const deltaLine = data[i]
    const deltaStart = data[i + 1]
    line += deltaLine
    character = deltaLine === 0 ? character + deltaStart : deltaStart
    const length = data[i + 2]
    const type = SEMANTIC_TOKEN_TYPES[data[i + 3]]
    const modifierBits = data[i + 4]
    const start = doc.offsetAt({ line, character })
    const end = doc.offsetAt({ line, character: character + length })
    tokens.push({
      text: doc.getText().slice(start, end),
      start,
      end,
      type,
      modifiers: SEMANTIC_TOKEN_MODIFIERS.filter((_, index) => modifierBits & (1 << index))
    })
  }
  return tokens
}

function decodeSemanticTokens(doc: ReturnType<typeof createDoc>, data: number[]) {
  return decodeSemanticTokenRanges(doc, data).map(({ text, type, modifiers }) => ({ text, type, modifiers }))
}

function renderTokens(content: string, ext: Parameters<typeof createDoc>[0] = 'tsx', settings?: ConstructorParameters<typeof CSSLanguageService>[0]) {
  const doc = createDoc(ext, content)
  const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'always', ...settings })
  const semanticTokens = languageService.renderSemanticTokens(doc)
  return {
    doc,
    tokens: decodeSemanticTokens(doc, semanticTokens?.data ?? [])
  }
}

function expectToken(tokens: { text: string, type: string, modifiers: string[] }[], text: string, type: string, modifiers: string[] = []) {
  expect(tokens).toContainEqual({ text, type, modifiers })
}

test.concurrent('renders semantic tokens for class attributes', () => {
  const { tokens } = renderTokens(
    '<div className="fg:brand:hover@sm block block:hover block:state-name hidden_div::before:of(.active) m:4x bg:rgb(0|0|0) w:0.625rem::scrollbar btn btn:hover@sm btn_div::before"></div>',
    'tsx',
    {
      manifest: createPresetManifest({
        variables: [{ key: 'brand', value: '#123456' }],
        utilities: [
          {
            name: 'btn',
            layer: 'components',
            rules: [
              { selector: '&', declarations: { color: 'var(--brand)' } },
              { selector: '&', declarations: { display: 'block' } }
            ]
          }
        ]
      })
    }
  )

  expectToken(tokens, 'fg', 'property')
  expectToken(tokens, ':', 'operator', ['declarationSeparator'])
  expectToken(tokens, 'brand', 'variable')
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, '@sm', 'keyword', ['query'])
  expectToken(tokens, 'block', 'enumMember')
  expectToken(tokens, 'state-name', 'modifier', ['pseudoClass'])
  expectToken(tokens, 'hidden', 'enumMember')
  expectToken(tokens, '_', 'operator', ['selector', 'selectorCombinator'])
  expectToken(tokens, 'div', 'type', ['selector'])
  expectToken(tokens, '::', 'operator', ['pseudoElement', 'selector', 'pseudoElementDelimiter'])
  expectToken(tokens, 'before', 'modifier', ['pseudoElement'])
  expectToken(tokens, 'of', 'modifier', ['pseudoClass'])
  expectToken(tokens, '.', 'operator', ['selector', 'selectorPunctuation'])
  expectToken(tokens, 'active', 'class', ['selector'])
  expectToken(tokens, '4', 'number')
  expectToken(tokens, 'x', 'enumMember', ['unit'])
  expectToken(tokens, 'rgb', 'function')
  expectToken(tokens, 'scrollbar', 'modifier', ['pseudoElement'])
  expectToken(tokens, 'btn', 'class', ['declaration', 'component'])
  expect(tokens.filter(({ text, type, modifiers }) => text === 'btn' && type === 'class' && modifiers.includes('declaration') && modifiers.includes('component'))).toHaveLength(3)
})

test.concurrent('renders semantic tokens for CSS-like values', () => {
  const { tokens } = renderTokens(
    '<div className="h:$size-sm fg:$color-blue-50/.5 content:x::before bg:rgb(0|0|0) fg:red_:where(a:hover) font:mono_:is(code,pre)@base font:semibold_:headings font:semibold_:is(h1,h2,h3,h4,h5,h6)"></div>',
    'tsx',
    {
      manifest: createPresetManifest({
        variables: [
          { key: 'size-sm', value: 16 },
          { namespace: 'color', key: 'blue-50', value: 'oklch(60% 0.2 250)' }
        ]
      })
    }
  )

  expectToken(tokens, '$size-sm', 'variable')
  expectToken(tokens, '$color-blue-50', 'variable')
  expectToken(tokens, '/', 'operator', ['valueSeparator'])
  expectToken(tokens, '.5', 'number')
  expectToken(tokens, 'x', 'enumMember')
  expectToken(tokens, '::', 'operator', ['pseudoElement', 'selector', 'pseudoElementDelimiter'])
  expectToken(tokens, 'before', 'modifier', ['pseudoElement'])
  expectToken(tokens, 'rgb', 'function')
  expectToken(tokens, '|', 'operator', ['valueSeparator'])
  expectToken(tokens, '_', 'operator', ['selector', 'selectorCombinator'])
  expectToken(tokens, 'where', 'modifier', ['pseudoClass'])
  expectToken(tokens, '(', 'operator', ['selector', 'selectorPunctuation'])
  expectToken(tokens, 'a', 'type', ['selector'])
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, ')', 'operator', ['selector', 'selectorPunctuation'])
  expectToken(tokens, 'is', 'modifier', ['pseudoClass'])
  expectToken(tokens, 'code', 'type', ['selector'])
  expectToken(tokens, ',', 'operator', ['selector', 'selectorPunctuation'])
  expectToken(tokens, 'pre', 'type', ['selector'])
  expectToken(tokens, 'headings', 'modifier', ['pseudoClass'])
  expectToken(tokens, 'h1', 'type', ['selector'])
  expectToken(tokens, 'h2', 'type', ['selector'])
  expectToken(tokens, 'h3', 'type', ['selector'])
  expectToken(tokens, 'h4', 'type', ['selector'])
  expectToken(tokens, 'h5', 'type', ['selector'])
  expectToken(tokens, 'h6', 'type', ['selector'])
  expectToken(tokens, '@base', 'keyword', ['query'])
})

test.concurrent('renders semantic tokens for vendor-prefixed native declarations', () => {
  const { tokens } = renderTokens(
    '<div className="-webkit-text-size-adjust:none -moz-text-size-adjust:none -ms-text-size-adjust:none"></div>',
    'tsx'
  )

  expectToken(tokens, '-webkit-text-size-adjust', 'property')
  expectToken(tokens, '-moz-text-size-adjust', 'property')
  expectToken(tokens, '-ms-text-size-adjust', 'property')
  expectToken(tokens, ':', 'operator', ['declarationSeparator'])
  expect(tokens.filter(({ text, type }) => text === 'none' && type === 'enumMember')).toHaveLength(3)
})

test.concurrent('renders semantic tokens for container queries and slash-separated string values', () => {
  const { tokens } = renderTokens(
    '<div className="hidden@container(sm&<=md) container:card/inline-size grid-cols:2@card(3xs) bg-center bg-cover bg:url(/hero.jpg) hidden@media(pointer:coarse) hidden@h>=sm&h<lg"></div>',
    'html'
  )

  expectToken(tokens, 'hidden', 'enumMember')
  expectToken(tokens, '@container', 'keyword', ['query'])
  expectToken(tokens, '(', 'operator', ['query', 'queryPunctuation'])
  expectToken(tokens, 'sm', 'enumMember', ['query'])
  expectToken(tokens, '&', 'operator', ['query', 'queryOperator'])
  expectToken(tokens, '<=', 'operator', ['query', 'queryOperator'])
  expectToken(tokens, 'md', 'enumMember', ['query'])
  expectToken(tokens, ')', 'operator', ['query', 'queryPunctuation'])
  expectToken(tokens, 'container', 'property')
  expectToken(tokens, 'card', 'enumMember')
  expectToken(tokens, '/', 'operator', ['valueSeparator'])
  expectToken(tokens, 'inline-size', 'enumMember')
  expectToken(tokens, 'grid-cols', 'property')
  expectToken(tokens, '2', 'number')
  expectToken(tokens, '@card', 'keyword', ['query'])
  expectToken(tokens, '3', 'number', ['query'])
  expectToken(tokens, 'xs', 'enumMember', ['query', 'unit'])
  expectToken(tokens, 'bg-center', 'enumMember')
  expectToken(tokens, 'bg-cover', 'enumMember')
  expectToken(tokens, 'bg', 'property')
  expectToken(tokens, 'url', 'function')
  expectToken(tokens, '/hero.jpg', 'string')
  expectToken(tokens, '@media', 'keyword', ['query'])
  expectToken(tokens, 'pointer', 'property', ['query'])
  expectToken(tokens, ':', 'operator', ['query', 'queryPunctuation'])
  expectToken(tokens, 'coarse', 'enumMember', ['query'])
  expectToken(tokens, '@h', 'keyword', ['query'])
  expectToken(tokens, '>=', 'operator', ['query', 'queryOperator'])
  expectToken(tokens, 'sm', 'enumMember', ['query'])
  expectToken(tokens, 'h', 'property', ['query'])
  expectToken(tokens, '<', 'operator', ['query', 'queryOperator'])
  expectToken(tokens, 'lg', 'enumMember', ['query'])
  expect(tokens.filter(({ text, type, modifiers }) => text === '/' && type === 'operator' && modifiers.includes('valueSeparator'))).toHaveLength(1)
})

test.concurrent('renders semantic tokens for internal styles dogfood directives', () => {
  const { tokens } = renderTokens([
    '@components {',
    '    monaco-editor {',
    '        @compose --vscode-editor-background:transparent! bg:blue filter:drop-shadow(0|2px|2px|rgba(0,0,0,.2px));',
    '    }',
    '}'
  ].join('\n'), 'css')

  expectToken(tokens, '--vscode-editor-background', 'property')
  expectToken(tokens, 'transparent', 'enumMember')
  expectToken(tokens, '!', 'operator', ['important'])
  expectToken(tokens, 'bg', 'property')
  expectToken(tokens, 'blue', 'enumMember')
  expectToken(tokens, 'filter', 'property')
  expectToken(tokens, 'drop-shadow', 'function')
  expectToken(tokens, 'rgba', 'function')
  expectToken(tokens, '.2', 'number')
  expectToken(tokens, 'px', 'enumMember', ['unit'])
})

test.concurrent('renders semantic tokens for grouped declarations, strings, units, and important marks', () => {
  const { tokens } = renderTokens(
    '<div class="{fg:red;bg:blue} transform:translate(10x|20px) content:\'a|b\' size:10x fg:red!"></div>',
    'html'
  )

  expectToken(tokens, '{', 'operator', ['blockBrace'])
  expectToken(tokens, ';', 'operator', ['declarationTerminator'])
  expectToken(tokens, '}', 'operator', ['blockBrace'])
  expectToken(tokens, ':', 'operator', ['declarationSeparator'])
  expectToken(tokens, 'fg', 'property')
  expectToken(tokens, 'red', 'enumMember')
  expectToken(tokens, 'bg', 'property')
  expectToken(tokens, 'blue', 'enumMember')
  expectToken(tokens, 'transform', 'property')
  expectToken(tokens, 'translate', 'function')
  expectToken(tokens, '(', 'operator', ['functionPunctuation'])
  expectToken(tokens, '10', 'number')
  expectToken(tokens, 'x', 'enumMember', ['unit'])
  // Master CSS uses `|` as a compact separator in places where native CSS
  // often uses whitespace or commas, so it keeps a distinct value role.
  expectToken(tokens, '|', 'operator', ['valueSeparator'])
  expectToken(tokens, '20', 'number')
  expectToken(tokens, 'px', 'enumMember', ['unit'])
  expectToken(tokens, ')', 'operator', ['functionPunctuation'])
  expectToken(tokens, '\'', 'string', ['quoted'])
  expectToken(tokens, 'a|b', 'string', ['quoted'])
  expectToken(tokens, 'x', 'enumMember', ['unit'])
  expectToken(tokens, '!', 'operator', ['important'])
})

test.concurrent('renders native-aligned semantic tokens for grouped classes with selector suffixes', () => {
  const { tokens } = renderTokens(
    '<div class="{text-align:center;block}>li:hover@sm"></div>',
    'html'
  )

  expectToken(tokens, '{', 'operator', ['blockBrace'])
  expectToken(tokens, 'text-align', 'property')
  expectToken(tokens, ':', 'operator', ['declarationSeparator'])
  expectToken(tokens, 'center', 'enumMember')
  expectToken(tokens, ';', 'operator', ['declarationTerminator'])
  expectToken(tokens, 'block', 'enumMember')
  expectToken(tokens, '}', 'operator', ['blockBrace'])
  expectToken(tokens, '>', 'operator', ['selector', 'selectorCombinator'])
  expectToken(tokens, 'li', 'type', ['selector'])
  expectToken(tokens, ':', 'operator', ['pseudoClass', 'selector', 'pseudoClassDelimiter'])
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, '@sm', 'keyword', ['query'])
  expect(tokens.some(({ text }) => text.includes('block}>li:hover@sm'))).toBe(false)
})

test.concurrent('renders semantic tokens only for CSS directive class-list spans', () => {
  const { tokens } = renderTokens(`
    @master entry;
    @reference "./tokens.css";
    @safelist "block fg:red:hover@md";

    @settings {
      root-size: 16;
    }

    @theme dark {
      --color-primary: --alpha(var(--color-blue-60) / 80%);
    }

    @theme {
      @keyframes fade {
        to {
          opacity: 1;
        }
      }
    }

    @custom-variant motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }

    @defaults {
      reset {
        @compose block;
      }
    }

    @components {
      btn {
        @compose inline-flex fg:primary:hover@md;
        @dark {
          @compose bg:blue;
        }
        @variant <sm {
          @compose block;
        }
        ::scrollbar-thumb:hover {
          @dark {
            @compose fg:primary;
          }
        }
      }
    }

    @utilities {
      content-auto {
        @compose block;
      }

      text-<left|center|right> {
        text-align: --value();
      }

      font:<~font-size|number> {
        font-size: --value();
      }

      bg:<~color|color> {
        background-color: --value();
      }

      text-decoration:<~color|*> {
        text-decoration: --value();
      }

      user-select:<auto|none|text|all> {
        user-select: --value();
      }

      grid-cols:<number> {
        grid-template-columns: repeat(--value(), minmax(0, 1fr));

        @variant <sm {
          font-size: --value();
        }

        &:hover {
          text-align: --value();
        }
      }
    }
  `, 'css')

  expectToken(tokens, 'block', 'enumMember')
  expectToken(tokens, 'fg', 'property')
  expectToken(tokens, 'red', 'enumMember')
  expectToken(tokens, 'primary', 'enumMember')
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, '@md', 'keyword', ['query'])
  expectToken(tokens, 'inline-flex', 'enumMember')
  expectToken(tokens, 'blue', 'enumMember')

  expect(tokens).not.toContainEqual({ text: '@master', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@reference', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@settings', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'root-size', type: 'property', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '@theme', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'dark', type: 'enumMember', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '--color-primary', type: 'variable', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '--color-blue-60', type: 'variable', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '@custom-variant', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@motion-safe', type: 'keyword', modifiers: ['query'] })
  expect(tokens).not.toContainEqual({ text: '@slot', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@defaults', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'reset', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@components', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'btn', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '<', type: 'operator', modifiers: ['query', 'queryOperator'] })
  expect(tokens).not.toContainEqual({ text: 'sm', type: 'enumMember', modifiers: ['query'] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'text-', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '--value', type: 'function', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'text-align', type: 'property', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'repeat', type: 'function', modifiers: [] })
})

test.concurrent('does not render semantic tokens for theme directive declarations', () => {
  const { tokens } = renderTokens(`
    @theme {
      --font-family-serif: var(--font-serif, ui-serif), Georgia, Cambria, "Times New Roman", Times, serif;
      --tracking-tightest: -0.072em;

      @keyframes zoom {
        0% {
          transform: scale(0);
          color: var(--color-red-50);
        }

        to {
          transform: --value();
        }
      }

      --color-stone-0: oklch(99% 0.0033 72);
    }

    @theme dark {
      --color-surface-base: var(--color-gray-100);
    }

    @theme inline {
      --full: 100%;
    }
  `, 'css')

  expect(tokens).toEqual([])
})

test.concurrent('renders semantic tokens only for compose class lists inside managed definition directives', () => {
  const { tokens } = renderTokens(`
    @defaults {
      reset {
        @light {
          color: var(--text, black);
        }
      }
    }

    @components {
      btn {
        @compose inline-flex;
        @dark {
          background-color: oklch(20% 0.03 250);
        }
        @media (width >= 42rem) {
          .label:hover {
            transform: scale(1);
          }
        }
      }

      btn:hover {
        @compose block;
      }
    }

    @utilities {
      font:<~font-size|number> {
        font-size: --value();
        &:hover {
          text-align: var(--align, center);
        }
      }

      text-<left|right> {
        text-align: --value();
      }
    }
  `, 'css')

  expectToken(tokens, 'inline-flex', 'enumMember')
  expectToken(tokens, 'block', 'enumMember')
  expect(tokens).not.toContainEqual({ text: '@defaults', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'reset', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@light', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@components', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'btn', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@dark', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'font', type: 'property', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'font-size', type: 'variable', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '--value', type: 'function', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'text-', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@media', type: 'keyword', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'label', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: 'hover', type: 'modifier', modifiers: ['pseudoClass'] })
  expect(tokens).not.toContainEqual({ text: 'font-size', type: 'property', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'var', type: 'function', modifiers: [] })
})

test.concurrent('renders CSS directive ranges with quoted semicolons', () => {
  const { tokens } = renderTokens(`
    @source not "a;b.css";
    @source "critical.tsx";
    @reference "./a;b.css";
    @safelist "block fg:red";
    @blocklist "debug-*";
    @preserve native;

    .btn {
      @compose fg:red;
    }

    @custom-variant quoted { @media (x: "a;b") { @slot; } }
  `, 'css')

  expectToken(tokens, 'block', 'enumMember')
  expectToken(tokens, 'fg', 'property')
  expectToken(tokens, 'red', 'enumMember')
  expect(tokens).not.toContainEqual({ text: '@source', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'not', type: 'modifier', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: ';', type: 'operator', modifiers: ['directive', 'directiveTerminator'] })
  expect(tokens).not.toContainEqual({ text: '@safelist', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@blocklist', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@preserve', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'native', type: 'enumMember', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@custom-variant', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@quoted', type: 'keyword', modifiers: ['query'] })
  expect(tokens).not.toContainEqual({ text: '@slot', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'debug-*', type: 'string', modifiers: ['quoted'] })
})

test.concurrent('does not tokenize quoted compose preludes as class lists', () => {
  const { tokens } = renderTokens('.btn { @compose "block fg:red"; }', 'css')

  expect(tokens).toEqual([])
})

test.concurrent('does not render semantic tokens for custom variant directive syntax', () => {
  const { tokens } = renderTokens(`
    @custom-variant supports-backdrop {
      @supports (backdrop-filter: blur(0)) {
        @slot;
      }
    }
    @custom-variant card-wide {
      @container card (width >= 42rem) {
        @slot;
      }
    }
    @custom-variant component {
      @layer components {
        @slot;
      }
    }
    @custom-variant start {
      @starting-style {
        @slot;
      }
    }
    @custom-variant scrollbars {
      @media all {
        @slot;
      }
    }
  `, 'css')

  expect(tokens).toEqual([])
})

test.concurrent('does not render inline theme modifier semantic tokens', () => {
  const { tokens } = renderTokens('@theme inline { --color-primary: #123; }', 'css')

  expect(tokens).toEqual([])
})


test.concurrent('does not render non-entry @master at-rules as CSS directives', () => {
  const { tokens } = renderTokens(`
    @master shake;
    @master no-shake;
  `, 'css')

  expect(tokens).not.toContainEqual({ text: '@master', type: 'keyword', modifiers: ['directive'] })
})

