import type { Pattern } from 'fast-glob'
import { Options as ExtractorOptions } from '@master/css-extractor'

/* The default options */
const options: PluginOptions = {
    mode: 'runtime',
    config: 'master.css',
    injectNormalCSS: true,
    injectRuntime: true,
    injectVirtualModule: true,
    avoidFOUC: true,
}

export default options

export interface PluginOptions {
    /**
     * Defines how Master CSS should be integrated into the build.
     *
     * - `'runtime'`: Detects the application's entry file, automatically injects the initialization of CSSRuntime, and imports the config code.
     * - `'extract'`: Detects the application's entry file, automatically imports the `virtual:master.css` module, and triggers the static extraction workflow.
     * - `'pre-render'`: Renders all `*.html` dependencies and injects CSS internally. This mode may be integrated with other SSR capabilities.
     * - `'progressive'`: Combines `'runtime'` and `'pre-render'` modes.
     * - `null`: Disables automatic integration
     */
    mode?: 'runtime' | 'extract' | 'progressive' | 'pre-render' | null

    /**
     * Glob pattern(s) or extractor options for the static extraction mode
     *
     * - Provide a glob `Pattern` to manually specify your extractor config.
     * - Or provide `ExtractorOptions` for fine-grained extractor configuration.
     */
    extractor?: ExtractorOptions | Pattern

    /**
     * Path to the Master CSS config file.
     * Defaults to `'master.css'`.
     */
    config?: string

    /**
     * Whether to inject the `@master/normal.css` module into the entry file.
     */
    injectNormalCSS?: boolean

    /**
     * Whether to include Master CSS’s runtime engine into the entry file.
     */
    injectRuntime?: boolean

    /**
     * Whether to register the virtual module `virtual:master.css`.
     * Allows importing it directly in user code for dynamic injection.
     */
    injectVirtualModule?: boolean

    /**
     * Prevents Flash of Unstyled Content (FOUC) during the initial render.
     * Useful in Runtime
     */
    avoidFOUC?: boolean
}
