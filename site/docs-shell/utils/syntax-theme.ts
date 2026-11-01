import type { ThemeRegistration } from 'shiki/core'

/** Presentation only: native grammars and the Master CSS adapter share these scopes. */
const syntaxTheme = {
  name: 'master-site',
  type: 'dark',
  colors: {
    'editor.foreground': 'var(--ui-code-text)',
    'editor.background': 'var(--ui-surface-code)'
  },
  tokenColors: [
    { scope: ['variable', 'meta.embedded'], settings: { foreground: 'var(--ui-code-text)' } },
    { scope: ['keyword', 'storage'], settings: { foreground: 'var(--ui-code-keyword)' } },
    { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: 'var(--ui-code-punctuation)' } },
    {
      // Word operators read as keywords, not symbols.
      scope: ['keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.word', 'keyword.operator.logical.feature', 'keyword.operator.logical.and.media', 'keyword.operator.logical.not.media', 'keyword.operator.logical.only.media', 'keyword.operator.logical.to'],
      settings: { foreground: 'var(--ui-code-keyword)' }
    },
    {
      scope: ['entity.name', 'support.function', 'support.type', 'support.class', 'entity.other.inherited-class'],
      settings: { foreground: 'var(--ui-code-function)' }
    },
    {
      scope: ['entity.other.attribute-name', 'support.type.property-name', 'support.variable.property', 'variable.other.property', 'variable.object.property', 'variable.other.key', 'meta.object-literal.key', 'meta.mapping.key'],
      settings: { foreground: 'var(--ui-code-property)' }
    },
    {
      scope: ['string', 'punctuation.definition.string', 'support.constant.property-value', 'support.constant.font-name', 'support.constant.color', 'support.constant.media', 'constant.other.color'],
      settings: { foreground: 'var(--ui-code-string)' }
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'keyword.other.unit', 'entity.other.keyframe-offset.percentage'],
      settings: { foreground: 'var(--ui-code-number)' }
    },
    {
      scope: ['entity.other.attribute-name.class', 'entity.other.attribute-name.id'],
      settings: { foreground: 'var(--ui-code-function)' }
    },
    {
      scope: ['entity.other.attribute-name.pseudo-class', 'entity.other.attribute-name.pseudo-element', 'entity.other.keyframe-offset', 'keyword.other.important', 'keyword.operator.important', 'punctuation.definition.keyword'],
      settings: { foreground: 'var(--ui-code-keyword)' }
    },
    { scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring.multi'], settings: { foreground: 'var(--ui-code-comment)' } },
    { scope: ['markup.heading', 'markup.bold'], settings: { foreground: 'var(--ui-code-function)' } },
    { scope: ['markup.inline', 'markup.raw', 'markup.underline.link'], settings: { foreground: 'var(--ui-code-string)' } },
    { scope: 'markup.inserted', settings: { foreground: 'var(--ui-status-success)' } },
    // Grammar `invalid` scopes flag valid docs code such as custom elements and `<hash>` placeholders; they keep their host role.
    { scope: 'markup.deleted', settings: { foreground: 'var(--ui-status-danger)' } }
  ]
} satisfies ThemeRegistration

export default syntaxTheme
