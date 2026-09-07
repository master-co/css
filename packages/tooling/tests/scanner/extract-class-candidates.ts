import { afterAll } from 'vitest'
import { createTestToolingSession } from '../helpers/create-tooling-session'

const session = createTestToolingSession()

afterAll(() => session.dispose())

export function extractClassCandidates(content: string) {
  return session.extractClassCandidates(content)
}
