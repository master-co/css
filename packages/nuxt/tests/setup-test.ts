import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { createTest, type TestOptions } from '@nuxt/test-utils/e2e'
import { basename } from 'node:path'

const fixturePorts: Record<string, number> = {
  'pre-render': 49_101,
  'progressive': 49_102,
  runtime: 49_103,
  static: 49_104
}

function getFixturePort(rootDir = process.cwd()) {
  const fixturePort = fixturePorts[basename(rootDir)]
  if (fixturePort) return fixturePort

  let hash = 0
  for (const char of rootDir) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000
  }
  return 49_000 + hash
}

export function setupNuxtTest(options: Partial<TestOptions>) {
  const hooks = createTest({
    ...(!options.host && options.server !== false && !options.port
      ? { port: getFixturePort(options.rootDir) }
      : {}),
    ...options
  })

  hooks.ctx.mockFn = vi.fn as unknown as (...args: unknown[]) => unknown
  beforeAll(hooks.beforeAll, hooks.ctx.options.setupTimeout)
  beforeEach(hooks.beforeEach)
  afterEach(hooks.afterEach)
  afterAll(hooks.afterAll, hooks.ctx.options.teardownTimeout)
}
