import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingBackendSync } from '@master/css-backend/tooling/node'
import { bindLexerSession } from './lexer/session'
import { bindLanguageSession } from './language/session'
import { bindLintSession } from './lint/backend-session'
import { bindSourceExtractor } from './source/session'
import {
  bindToolingSessionInternal,
  type MasterCSSToolingSession
} from './tooling-session'
import { bindValidatorSession } from './validator/backend-session'

export type { MasterCSSToolingSession } from './tooling-session'
export {
  supportsNativeDeclaration,
  type MasterCSSNativeDeclarationCandidate
} from './host'

export function createToolingSessionSync(options: {
  readonly manifest: MasterCSSManifest
}): MasterCSSToolingSession {
  const tooling = createToolingBackendSync()
  const lexer = tooling.createLexerSession()
  const source = tooling.createSourceSession()
  const validator = tooling.createValidatorSession(options.manifest)
  const language = tooling.createLanguageSession(options.manifest)
  const lint = tooling.createLintSession(options.manifest)
  const lintValidator = tooling.createValidatorSession(options.manifest)
  const lintLanguage = tooling.createLanguageSession(options.manifest)
  return bindToolingSessionInternal({
    lexer: bindLexerSession('native', lexer),
    source: bindSourceExtractor('native', source),
    validator: bindValidatorSession(
      'native',
      validator
    ),
    lint: bindLintSession(lint, lintValidator, lintLanguage),
    language: bindLanguageSession('native', language)
  })
}
