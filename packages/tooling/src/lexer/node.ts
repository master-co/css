import { createNativeLexerSession, type LexerSession } from './session'

export { LexerSessionError, type LexerSession } from './session'

export function createLexerSessionSync(): LexerSession {
  return createNativeLexerSession({ required: true })!
}
