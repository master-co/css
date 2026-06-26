import type { ViteUserConfig } from 'vitest/config'

export const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
export const defaultVitestTestTimeout = 60_000
export const ciVitestTestTimeout = 180_000

function maxCITimeout(timeout: unknown) {
    return typeof timeout === 'number'
        ? Math.max(timeout, ciVitestTestTimeout)
        : ciVitestTestTimeout
}

export function withCITimeouts(test: NonNullable<ViteUserConfig['test']> = {}): NonNullable<ViteUserConfig['test']> {
    return {
        ...test,
        ...(isCI
            ? {
                testTimeout: maxCITimeout(test.testTimeout),
                hookTimeout: maxCITimeout(test.hookTimeout),
                teardownTimeout: maxCITimeout(test.teardownTimeout)
            }
            : {})
    }
}
