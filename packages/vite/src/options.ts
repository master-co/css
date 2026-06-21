import type { Options as ExtractorOptions } from '@master/css-extractor'

/* The default options */
const options: PluginOptions = {
    mode: 'runtime',
    injectRuntime: true,
    avoidFOUC: true,
}

export default options

export interface PluginOptions {
    /**
     * Defines how Master CSS should be integrated into the build.
     *
     * - `'runtime'`: Injects CSSRuntime through Vite's HTML transform and imports the project manifest code.
     * - `'static'`: Wires the generated CSS module and enables generated utilities in the shared style entry pipeline.
     * - `'pre-render'`: Renders all `*.html` dependencies and injects CSS internally. This mode may be integrated with other SSR capabilities.
     * - `'progressive'`: Combines `'runtime'` and `'pre-render'` modes.
     * - `null`: Disables automatic integration
     */
    mode?: 'runtime' | 'static' | 'progressive' | 'pre-render' | null

    /**
     * Extractor options for class usage scanning.
     */
    extractor?: ExtractorOptions

    /**
     * Whether to include Master CSS’s runtime engine through Vite's HTML transform.
     */
    injectRuntime?: boolean

    /**
     * Prevents Flash of Unstyled Content (FOUC) during the initial render.
     * Useful in Runtime
     */
    avoidFOUC?: boolean
}
