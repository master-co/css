import type { Options as ExtractorOptions } from '@master/css-extractor'

/* The default options */
const options: PluginOptions = {
    mode: 'runtime',
    config: 'master.css',
    injectRuntime: true,
    avoidFOUC: true,
}

export default options

export interface PluginOptions {
    /**
     * Defines how Master CSS should be integrated into the build.
     *
     * - `'runtime'`: Detects the application's entry file, automatically injects the initialization of CSSRuntime, and imports the config code.
     * - `'extract'`: Detects the application's entry file, wires the generated CSS module, and triggers the static extraction workflow.
     * - `'pre-render'`: Renders all `*.html` dependencies and injects CSS internally. This mode may be integrated with other SSR capabilities.
     * - `'progressive'`: Combines `'runtime'` and `'pre-render'` modes.
     * - `null`: Disables automatic integration
     */
    mode?: 'runtime' | 'extract' | 'progressive' | 'pre-render' | null

    /**
     * Extractor options for class usage scanning.
     */
    extractor?: ExtractorOptions

    /**
     * Path to the Master CSS config file.
     * Defaults to `'master.css'`.
     */
    config?: string

    /**
     * Whether to include Master CSS’s runtime engine into the entry file.
     */
    injectRuntime?: boolean

    /**
     * Prevents Flash of Unstyled Content (FOUC) during the initial render.
     * Useful in Runtime
     */
    avoidFOUC?: boolean
}
