import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

// SvelteKit 3's plugin rejects Vitest's SSR environment (`vite_ssr_environment_not_runnable`).
// These tests import the package entries directly, so they run without the Kit plugin.
export default defineConfig(config)
