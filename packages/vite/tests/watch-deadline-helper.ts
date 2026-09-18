// Watch and dev-server assertions wait on filesystem events and rebuilds, which
// slow down sharply when the whole workspace runs its suites at once: deadlines
// tuned to an idle machine turned into failures at Turbo's default concurrency.
// These bound failures only — vi.waitFor resolves as soon as its assertion
// passes — so they are generous rather than tight.
//
// The CI check mirrors shared/vitest-ci-config.ts, which package tests cannot
// import: it sits outside this project's rootDir.
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

export const watchDeadline = isCI ? 30_000 : 15_000
