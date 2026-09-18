import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest'
import { $fetch } from '@nuxt/test-utils'
import { createTest, type TestOptions } from '@nuxt/test-utils/e2e'
import { basename } from 'node:path'

// One port per test file rather than per fixture: bug-hunt-progressive shares
// the progressive fixture and bug-hunt-theme shares runtime, so keying on the
// fixture handed both files in each pair the same port and the second to boot
// failed with EADDRINUSE once Vitest ran the files in parallel.
const testPorts: Record<string, number> = {
  'pre-render': 49_101,
  progressive: 49_102,
  runtime: 49_103,
  static: 49_104,
  'bug-hunt-progressive': 49_105,
  'bug-hunt-theme': 49_106
}

function getTestPort() {
  const testPath = expect.getState().testPath ?? process.cwd()
  const testPort = testPorts[basename(testPath).replace(/\.test\.ts$/u, '')]
  if (testPort) return testPort

  // A file the table does not name still needs a port of its own; spread the
  // fallback wide enough that two of them are unlikely to meet.
  let hash = 0
  for (const char of testPath) {
    hash = (hash * 31 + char.charCodeAt(0)) % 8000
  }
  return 49_200 + hash
}

export function setupNuxtTest(options: Partial<TestOptions>) {
  const hooks = createTest({
    ...(!options.host && options.server !== false && !options.port
      ? { port: getTestPort() }
      : {}),
    ...options
  })

  hooks.ctx.mockFn = vi.fn as unknown as (...args: unknown[]) => unknown
  beforeAll(hooks.beforeAll, hooks.ctx.options.setupTimeout)
  beforeEach(hooks.beforeEach)
  afterEach(hooks.afterEach)
  afterAll(hooks.afterAll, hooks.ctx.options.teardownTimeout)
}

/**
 * A delivered stylesheet links its parts with @import, so the file the page
 * links is an index rather than the whole sheet. Compose the graph the way a
 * browser resolves it, so assertions describe the CSS that actually applies.
 */
export async function fetchDeliveredStylesheet(href: string) {
  const seen = new Set<string>()
  const compose = async (path: string): Promise<string> => {
    if (seen.has(path)) return ''
    seen.add(path)
    const text = await $fetch(path) as string
    const imported = await Promise.all([...text.matchAll(/@import\s+"([^"]+)"/gu)]
      .map(([, specifier]) => compose(new URL(specifier, new URL(path, 'http://nuxt.test/')).pathname)))
    return [...imported, text].join('\n')
  }
  return compose(href)
}
