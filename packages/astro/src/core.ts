import { AstroIntegration } from 'astro'
import { default as vitePlugin, CSS_RUNTIME_INJECTIOIN, defaultPluginOptions, PluginOptions } from '@master/css.vite'
declare type IntegrationOptions = {

} & PluginOptions

const defaultModuleOptions: IntegrationOptions = defaultPluginOptions

export default function masterCSS(options?: IntegrationOptions): AstroIntegration {
    options = { ...defaultModuleOptions, ...options }
    return {
        name: '@master/css.astro',
        hooks: {
            'astro:config:setup': async ({ config, injectScript, updateConfig }) => {
                switch (options.mode) {
                    case 'progressive':
                    case 'runtime':
                        injectScript('page', CSS_RUNTIME_INJECTIOIN)
                        updateConfig({ vite: { plugins: [vitePlugin({ ...options, injectRuntime: false })] } })
                        break
                    default:
                        updateConfig({ vite: { plugins: [vitePlugin(options)] } })
                        break
                }
                switch (options.mode) {
                    case 'progressive':
                        console.warn(`[@master/css.astro] 'progressive' mode is not yet supported. Use '@master/css-server' to set up server render first.`)
                        break
                    default:
                        break
                }
            }
        },
    }
}