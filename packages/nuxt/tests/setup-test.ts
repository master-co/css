import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { createTest, type TestOptions } from '@nuxt/test-utils/e2e'

export function setupNuxtTest(options: Partial<TestOptions>) {
    const hooks = createTest(options)

    hooks.ctx.mockFn = vi.fn as unknown as (...args: unknown[]) => unknown
    beforeAll(hooks.beforeAll, hooks.ctx.options.setupTimeout)
    beforeEach(hooks.beforeEach)
    afterEach(hooks.afterEach)
    afterAll(hooks.afterAll, hooks.ctx.options.teardownTimeout)
}
