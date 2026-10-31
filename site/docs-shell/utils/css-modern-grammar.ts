import type { LanguageRegistration } from 'shiki/core'

/*
 * Presentation-only additions to Shiki's CSS grammar for syntax the docs use but the bundled grammar predates:
 * nested rules and conditional groups inside declaration blocks, descriptor at-rules, container and scope
 * preludes, functions, properties or query features newer than its keyword lists, and CSS-in-JS templates.
 * Master CSS directives keep their own grammar.
 */

type Pattern = Record<string, unknown>

/**
 * Root grammars whose documents contain CSS. Shiki injects by root scope prefix, so a stylesheet embedded in
 * HTML, Vue, Svelte, Astro, MDX, a Markdown fence or a CSS-in-JS template needs its host listed; selectors still
 * require CSS scopes.
 */
export const cssInjectionHosts = ['source.css', 'text.html', 'source.svelte', 'source.astro', 'source.mdx', 'source.js', 'source.ts', 'source.tsx']

const scopePrelude: Pattern[] = [
  { match: '(?i)(?<=\\))\\s*(to)(?=\\s*\\()', captures: { 1: { name: 'keyword.operator.logical.to.css' } } },
  {
    begin: '\\(',
    beginCaptures: { 0: { name: 'punctuation.definition.parameters.begin.bracket.round.css' } },
    end: '\\)',
    endCaptures: { 0: { name: 'punctuation.definition.parameters.end.bracket.round.css' } },
    name: 'meta.selector.css',
    patterns: [{ include: 'source.css#selector-innards' }]
  }
]

const preludes: Record<string, Pattern[]> = {
  media: [{ include: 'source.css#media-query-list' }],
  container: [{ include: 'source.css#media-query-list' }],
  supports: [{ include: 'source.css#feature-query-operators' }, { include: 'source.css#feature-query' }],
  scope: scopePrelude,
  layer: [{ include: 'source.css#comment-block' }, { include: 'source.css#commas' }],
  'starting-style': [{ include: 'source.css#comment-block' }]
}

/** `@name prelude { body }` or `@name prelude;`, with the prelude in `meta.at-rule.<name>.header.css`. */
function atRule(name: string, prelude: Pattern[], body: Pattern): Pattern {
  return {
    begin: `(?i)((@)${name})(?![\\w-])`,
    beginCaptures: {
      1: { name: `keyword.control.at-rule.${name}.css` },
      2: { name: 'punctuation.definition.keyword.css' }
    },
    end: '(?<=[};])(?!\\G)',
    patterns: [
      { begin: '\\G(?!\\s*[;{])', end: '(?=\\s*[;{])', name: `meta.at-rule.${name}.header.css`, patterns: prelude },
      { match: ';', name: 'punctuation.terminator.rule.css' },
      body
    ]
  }
}

function block(patterns: Pattern[]): Pattern {
  return {
    begin: '\\{',
    beginCaptures: { 0: { name: 'punctuation.section.begin.bracket.curly.css' } },
    end: '\\}',
    endCaptures: { 0: { name: 'punctuation.section.end.bracket.curly.css' } },
    name: 'meta.at-rule.body.css',
    patterns
  }
}

const selectorInnards: Pattern[] = [
  { match: '&', name: 'entity.name.tag.nesting.css' },
  { include: 'source.css#selector-innards' }
]

const headers = [...Object.keys(preludes), 'custom-media'].map((name) => `-meta.at-rule.${name}.header.css`).join(' ')

/** Rules and conditional groups nested in a declaration block; their blocks accept declarations again. */
const cssNestingLanguage = {
  name: 'css-nesting',
  scopeName: 'source.css.nesting.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: `L:meta.property-list.css -meta.property-value.css -meta.property-name.css -meta.selector.css -meta.at-rule.header.css ${headers} -comment -string`,
  patterns: [
    ...Object.entries(preludes).map(([name, prelude]) => atRule(name, prelude, { include: 'source.css#rule-list' })),
    // Each begin consumes its selector: the injection stays active inside, so a zero-width begin would recur.
    {
      // At a statement start, including a CSS-in-JS template start, a selector reaches `{` before `;`.
      begin: '(?<=^\\s*|[{};`]\\s*)(?!--)((?:[&>+~*.#:\\[]|[-_a-zA-Z][\\w-]*)[^;{}]*?)(?<!\\$)(?=\\s*\\{)',
      beginCaptures: { 1: { name: 'meta.selector.css', patterns: selectorInnards } },
      end: '(?<=\\})',
      patterns: [{ include: 'source.css#rule-list' }]
    },
    {
      // A selector list continues on the following lines.
      begin: '(?<=^\\s*|[{};`]\\s*)([&>+~.#:\\[][^;{}]*,)\\s*$',
      beginCaptures: { 1: { name: 'meta.selector.css', patterns: selectorInnards } },
      end: '(?<=\\})',
      patterns: [
        { begin: '^', end: '(?=\\s*\\{)', name: 'meta.selector.css', patterns: selectorInnards },
        { include: 'source.css#rule-list' }
      ]
    }
  ]
} as unknown as LanguageRegistration

/** Stylesheet-level at-rules the bundled grammar reads as selectors or plain text. */
const cssAtRulesLanguage = {
  name: 'css-modern-at-rules',
  scopeName: 'source.css.modern-at-rules.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: `L:source.css -meta.property-list.css -meta.property-value.css -meta.selector.css -meta.at-rule.header.css ${headers} -comment -string`,
  patterns: [
    ...['property', 'view-transition', 'font-palette-values', 'position-try'].map((name) => atRule(name, [
      { include: 'source.css#comment-block' },
      { match: '--[\\w-]+', name: 'support.type.property-name.custom.css' }
    ], { include: 'source.css#rule-list' })),
    atRule('custom-media', [
      { match: '\\G\\s*(--[\\w-]+)', captures: { 1: { name: 'support.type.property-name.custom.css' } } },
      { include: 'source.css#media-query-list' }
    ], { include: 'source.css#comment-block' }),
    atRule('container', preludes.container, block([{ include: 'source.css' }])),
    atRule('scope', preludes.scope, block([{ include: 'source.css' }])),
    atRule('starting-style', preludes['starting-style'], block([{ include: 'source.css' }]))
  ]
} as unknown as LanguageRegistration

/** Query features the bundled lists predate, such as `prefers-color-scheme` or container `inline-size`. */
const cssQueryFeaturesLanguage = {
  name: 'css-query-features',
  scopeName: 'source.css.query-features.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: ['media', 'container', 'custom-media'].map((name) => `meta.at-rule.${name}.header.css -comment -string`).join(', '),
  patterns: [
    {
      match: '(?i)(?<=\\(\\s*)([a-z][\\w-]*)(?=\\s*[:<>=)])',
      captures: { 1: { name: 'support.type.property-name.media.css' } }
    },
    { match: '(?i)(?<=:\\s*)[a-z][\\w-]*(?=\\s*\\))', name: 'support.constant.property-value.css' }
  ]
} as unknown as LanguageRegistration

/** Docs elide CSS with `...`; as a selector it would swallow the rest, including an HTML `</style>`. */
const cssPlaceholderLanguage = {
  name: 'css-placeholder',
  scopeName: 'source.css.placeholder.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: 'L:source.css -meta.property-value.css -comment -string',
  patterns: [{ match: '\\.{3}|…', name: 'comment.other.placeholder.css' }]
} as unknown as LanguageRegistration

/** `@import` conditions: `layer(name)` and `supports(declaration)`. */
const cssImportLanguage = {
  name: 'css-import-conditions',
  scopeName: 'source.css.import-conditions.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: 'L:meta.at-rule.import.css -comment -string',
  patterns: [['layer', [{ include: 'source.css#comment-block' }]], ['supports', [{ include: 'source.css#rule-list-innards' }]]].map(([name, patterns]) => ({
    begin: `(?i)(?<![\\w-])(${name})(\\()`,
    beginCaptures: {
      1: { name: 'support.function.misc.css' },
      2: { name: 'punctuation.section.function.begin.bracket.round.css' }
    },
    end: '\\)',
    endCaptures: { 0: { name: 'punctuation.section.function.end.bracket.round.css' } },
    name: `meta.function.${name}.css`,
    patterns
  }))
} as unknown as LanguageRegistration

/** `@supports selector(...)` tests a selector, not a declaration. */
const cssSupportsSelectorLanguage = {
  name: 'css-supports-selector',
  scopeName: 'source.css.supports-selector.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: 'L:meta.at-rule.supports.header.css -comment -string',
  patterns: [
    {
      begin: '(?i)(?<![\\w-])(selector)(\\()',
      beginCaptures: {
        1: { name: 'support.function.misc.css' },
        2: { name: 'punctuation.section.function.begin.bracket.round.css' }
      },
      end: '\\)',
      endCaptures: { 0: { name: 'punctuation.section.function.end.bracket.round.css' } },
      name: 'meta.function.selector.css',
      patterns: [
        {
          begin: '(?=\\S)',
          end: '(?=\\))',
          name: 'meta.selector.css',
          patterns: selectorInnards
        }
      ]
    }
  ]
} as unknown as LanguageRegistration

/** Functions newer than the bundled list, such as `light-dark()` and `env()`, read as functions; `/` separates values. */
const cssFunctionsLanguage = {
  name: 'css-modern-functions',
  scopeName: 'source.css.modern-functions.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: 'meta.property-value.css -comment -string',
  patterns: [
    {
      begin: '(?i)(?<![\\w-])((?:-(?:webkit|moz|o|ms)-)?[a-z][\\w-]*)(\\()',
      beginCaptures: {
        1: { name: 'support.function.misc.css' },
        2: { name: 'punctuation.section.function.begin.bracket.round.css' }
      },
      end: '\\)',
      endCaptures: { 0: { name: 'punctuation.section.function.end.bracket.round.css' } },
      name: 'meta.function.misc.css',
      patterns: [{ include: 'source.css#property-values' }]
    },
    { match: '/', name: 'punctuation.separator.slash.css' }
  ]
} as unknown as LanguageRegistration

function functionalPseudo(colons: string, kind: string, names = '[a-z][\\w-]*'): Pattern {
  return {
    begin: `(?i)(${colons})(${names})(\\()`,
    beginCaptures: {
      1: { name: 'punctuation.definition.entity.css' },
      2: { name: `entity.other.attribute-name.pseudo-${kind}.css` },
      3: { name: 'punctuation.section.function.begin.bracket.round.css' }
    },
    end: '\\)',
    endCaptures: { 0: { name: 'punctuation.section.function.end.bracket.round.css' } },
    name: `meta.function.pseudo-${kind}.css`,
    patterns: [{ include: 'source.css#selector-innards' }]
  }
}

/** Pseudo-classes and pseudo-elements newer than the bundled lists, with or without arguments. */
const cssPseudoLanguage = {
  name: 'css-modern-pseudo',
  scopeName: 'source.css.modern-pseudo.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: 'meta.selector.css -comment -string',
  patterns: [
    functionalPseudo('::', 'element'),
    functionalPseudo(':', 'class'),
    {
      match: '(?i)(::)[a-z][\\w-]*',
      captures: {
        0: { name: 'entity.other.attribute-name.pseudo-element.css' },
        1: { name: 'punctuation.definition.entity.css' }
      }
    },
    {
      match: '(?i)(:)[a-z][\\w-]*',
      captures: {
        0: { name: 'entity.other.attribute-name.pseudo-class.css' },
        1: { name: 'punctuation.definition.entity.css' }
      }
    }
  ]
} as unknown as LanguageRegistration

/** The bundled grammar knows `:host` only without its selector argument. */
const cssHostLanguage = {
  name: 'css-host',
  scopeName: 'source.css.host.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: 'L:meta.selector.css -comment -string',
  patterns: [functionalPseudo(':', 'class', 'host|host-context')]
} as unknown as LanguageRegistration

const scriptHosts = ['source.js', 'source.ts', 'source.tsx']

/** CSS-in-JS tagged templates hold declarations and nested rules: `styled.button`, `styled(Card)`, `css`, `keyframes`. */
const cssInJSLanguage = {
  name: 'css-in-js',
  scopeName: 'source.css.in-js.injection',
  injectTo: scriptHosts,
  injectionSelector: 'L:source -comment -string',
  patterns: [
    {
      // The tag is part of the match: the script grammar would otherwise hold its tagged-template call open past the template.
      begin: '(?<![\\w$.])(?:(styled)(?:(\\.)([\\w$]+)|(\\()([\\w$.]*)(\\)))|(css|keyframes|createGlobalStyle|injectGlobal))(`)',
      beginCaptures: {
        1: { name: 'variable.other.object.js' },
        2: { name: 'punctuation.accessor.js' },
        3: { name: 'entity.name.function.tagged-template.js' },
        4: { name: 'meta.brace.round.js' },
        5: { name: 'variable.other.readwrite.js' },
        6: { name: 'meta.brace.round.js' },
        7: { name: 'entity.name.function.tagged-template.js' },
        8: { name: 'string.template.js punctuation.definition.string.template.begin.js' }
      },
      end: '`',
      endCaptures: { 0: { name: 'string.template.js punctuation.definition.string.template.end.js' } },
      contentName: 'meta.embedded.css-in-js source.css meta.property-list.css',
      patterns: [{ include: 'source.css#rule-list-innards' }]
    }
  ]
} as unknown as LanguageRegistration

/** `${...}` stays a script expression anywhere in a CSS-in-JS template, including inside a declaration value. */
const cssInJSSubstitutionLanguage = {
  name: 'css-in-js-substitution',
  scopeName: 'source.css.in-js-substitution.injection',
  injectTo: scriptHosts,
  injectionSelector: 'L:meta.embedded.css-in-js -comment',
  patterns: [{ include: 'source.ts#template-substitution-element' }]
} as unknown as LanguageRegistration

/** A custom property declaration names a property, as in `@theme`; `var(--name)` references stay variables. */
const cssCustomPropertyLanguage = {
  name: 'css-custom-property',
  scopeName: 'source.css.custom-property.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: 'L:meta.property-list.css -meta.property-value.css -meta.selector.css -comment -string',
  patterns: [{ match: '(?<![\\w-])--[\\w-]+(?=\\s*:)', name: 'support.type.property-name.custom.css' }]
} as unknown as LanguageRegistration

/** Property names newer than the bundled list keep the property role. */
const cssPropertyNamesLanguage = {
  name: 'css-modern-property-names',
  scopeName: 'source.css.modern-property-names.injection',
  injectTo: cssInjectionHosts,
  injectionSelector: 'meta.property-name.css -comment -string',
  patterns: [{ match: '(?<![\\w-])-?[a-zA-Z][\\w-]*', name: 'support.type.property-name.css' }]
} as unknown as LanguageRegistration

export default [
  cssNestingLanguage,
  cssAtRulesLanguage,
  cssQueryFeaturesLanguage,
  cssPlaceholderLanguage,
  cssImportLanguage,
  cssSupportsSelectorLanguage,
  cssFunctionsLanguage,
  cssPseudoLanguage,
  cssHostLanguage,
  cssCustomPropertyLanguage,
  cssPropertyNamesLanguage,
  cssInJSLanguage,
  cssInJSSubstitutionLanguage
]
