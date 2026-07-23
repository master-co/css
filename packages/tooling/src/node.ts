import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSError } from '@master/css-schema'
import { loadNativeToolingBackend } from '@master/css-backend/tooling'
import { createNativeLexerSession } from './lexer/session'
import { createNativeLanguageSession } from './language/backend-session'
import { createNativeLintSession } from './lint/backend-session'
import { createNativeSourceExtractor } from './source/session'
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
  const tooling = loadNativeToolingBackend({ required: true })!
  const source = createNativeSourceExtractor()
  if (!source) {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'tooling',
      message: 'createToolingSessionSync() requires the Master CSS native binding.'
    })
  }
  const validator = tooling.createValidatorSession(options.manifest)
  return bindToolingSessionInternal({
    lexer: createNativeLexerSession({ required: true })!,
    source,
    validator: bindValidatorSession(
      'native',
      {
        nativeDeclarationCandidates: (classNames) =>
          validator.nativeDeclarationCandidates(classNames),
        generateClasses: (classNames, nativeSupport) =>
          validator.generateClassRules(classNames, nativeSupport),
        dispose: () => validator.dispose()
      }
    ),
    lint: createNativeLintSession(options.manifest, { required: true })!,
    language: createNativeLanguageSession(options.manifest, { required: true })!
  })
}
