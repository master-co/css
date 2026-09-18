import { availableParallelism } from 'node:os'
import type { ViteUserConfig } from 'vitest/config'
import { defaultVitestTestTimeout, isCI, withCITimeouts } from './vitest-ci-config'

// Turbo runs many package suites at once and each one otherwise sizes its own
// fork pool to the whole machine, so the pools oversubscribe the CPU several
// times over. Cap each suite instead of letting every one of them claim it all.
const maxWorkers = isCI ? '50%' : Math.max(2, Math.ceil(availableParallelism() / 4))

const config: ViteUserConfig = {
  test: withCITimeouts({
    maxWorkers,
    include: [
      'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'tests/**/test.?(c|m)[jt]s?(x)'
    ],
    exclude: [
      '**/tmp/**'
    ],
    testTimeout: defaultVitestTestTimeout,
    forceRerunTriggers: [
      'vitest.config.*',
      'vite.config.*',
      '**/*generated.css',
      'package.json',
      '**/*.output.*',
      '**/*.input.*',
      '**/fixtures/**/*'
    ]
  }),
  resolve: {
    tsconfigPaths: true
  }
}

export default config
