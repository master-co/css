import type { ViteUserConfig } from 'vitest/config'

export const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

export function withCIConcurrency(test: NonNullable<ViteUserConfig['test']> = {}): NonNullable<ViteUserConfig['test']> {
    return {
        ...test,
        ...(isCI ? { maxConcurrency: 1 } : {})
    }
}
