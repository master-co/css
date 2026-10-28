import type { ThemeRegistration } from 'shiki/core'

/** Presentation only: native grammars and the Master CSS adapter share these scopes. */
const syntaxTheme = {
  name: 'master-site',
  type: 'dark',
  colors: {
    'editor.foreground': 'var(--color-code-text)',
    'editor.background': 'var(--color-code-surface)'
  },
  tokenColors: [
    { scope: ['variable', 'meta.embedded'], settings: { foreground: 'var(--color-code-text)' } },
    { scope: ['keyword', 'storage'], settings: { foreground: 'var(--color-code-keyword)' } },
    { scope: ['punctuation', 'keyword.operator'], settings: { foreground: 'var(--color-code-punctuation)' } },
    {
      scope: ['entity.name', 'support.function', 'support.type', 'entity.other.inherited-class'],
      settings: { foreground: 'var(--color-code-function)' }
    },
    {
      scope: ['entity.other.attribute-name', 'support.type.property-name', 'support.variable.property', 'variable.other.property', 'variable.object.property', 'meta.object-literal.key', 'meta.mapping.key'],
      settings: { foreground: 'var(--color-code-property)' }
    },
    {
      scope: ['string', 'punctuation.definition.string', 'support.constant.property-value', 'support.constant.font-name', 'support.constant.color', 'constant.other.color'],
      settings: { foreground: 'var(--color-code-string)' }
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'keyword.other.unit'],
      settings: { foreground: 'var(--color-code-number)' }
    },
    {
      scope: ['entity.other.attribute-name.class', 'entity.other.attribute-name.id'],
      settings: { foreground: 'var(--color-code-function)' }
    },
    {
      scope: ['entity.other.attribute-name.pseudo-class', 'entity.other.attribute-name.pseudo-element', 'keyword.other.important', 'keyword.operator.important', 'punctuation.definition.keyword'],
      settings: { foreground: 'var(--color-code-keyword)' }
    },
    { scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring.multi'], settings: { foreground: 'var(--color-code-comment)' } },
    { scope: ['markup.heading', 'markup.bold'], settings: { foreground: 'var(--color-code-function)' } },
    { scope: ['markup.inline', 'markup.raw', 'markup.underline.link'], settings: { foreground: 'var(--color-code-string)' } },
    { scope: 'markup.inserted', settings: { foreground: 'var(--color-code-success)' } },
    { scope: ['markup.deleted', 'invalid'], settings: { foreground: 'var(--color-code-danger)' } }
  ]
} satisfies ThemeRegistration

export default syntaxTheme
