import { UserWorkspaceConfig, defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

export default defineConfig({
    ...config,
    test: {
        ...config.test,
        setupFiles: ['./tests/setup.ts']
    }
} as UserWorkspaceConfig)
