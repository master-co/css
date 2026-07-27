import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '@master/css-tooling/language'
import createDoc, { languageIdOfExt } from '../../src/utils/create-doc'
import CSSLanguageService from './rc87-language-service'

type Extension = keyof typeof languageIdOfExt

function extension(languageId: string): Extension {
  if (languageId === 'typescriptreact') return 'tsx'
  if (languageId === 'javascriptreact') return 'jsx'
  if (languageId === 'typescript') return 'ts'
  if (languageId === 'javascript') return 'js'
  return languageId as Extension
}

export function renderBrowserSemanticTokens(
  source: string,
  languageId: string,
  options: ConstructorParameters<typeof CSSLanguageService>[0] = {}
) {
  const doc = createDoc(extension(languageId), source)
  const service = new CSSLanguageService({
    embeddedSyntaxHighlighting: 'always',
    ...options
  })
  return service.renderSemanticTokens(doc)
}

export function collectBrowserSemanticTokenItems(
  source: string,
  languageId: string,
  options: ConstructorParameters<typeof CSSLanguageService>[0] = {}
) {
  const doc = createDoc(extension(languageId), source)
  const data = renderBrowserSemanticTokens(source, languageId, options)?.data || []
  const tokens: {
    start: number
    end: number
    type: string
    modifiers: string[]
  }[] = []
  let line = 0
  let character = 0
  for (let index = 0; index < data.length; index += 5) {
    const deltaLine = data[index]
    line += deltaLine
    character = deltaLine === 0 ? character + data[index + 1] : data[index + 1]
    const length = data[index + 2]
    const modifierBits = data[index + 4]
    const start = doc.offsetAt({ line, character })
    tokens.push({
      start,
      end: doc.offsetAt({ line, character: character + length }),
      type: SEMANTIC_TOKEN_TYPES[data[index + 3]],
      modifiers: SEMANTIC_TOKEN_MODIFIERS.filter((_, modifierIndex) =>
        modifierBits & (1 << modifierIndex)
      )
    })
  }
  return tokens
}
