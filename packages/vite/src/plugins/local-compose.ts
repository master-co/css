import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { loadProjectManifest } from '@master/css-manifest/load'
import {
    hasLocalStyleDirectives,
    isStyleCSSRequest,
    resolveMasterStyleSource,
    transformLocalStyleCSS
} from '@master/css-stylesheet'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'

function invalidateModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
    if (!module) return false
    server.moduleGraph.invalidateModule(module)
    return module.importers.size > 0
}

export default function LocalComposePlugin(options: PluginOptions, context: PluginContext): Plugin {
    let projectManifest: Awaited<ReturnType<typeof loadProjectManifest>> | undefined
    let projectManifestDependencies: string[] = []
    const localComposeModules = new Set<string>()

    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }

    const loadComposeContext = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
        if (projectManifest) return projectManifest
        projectManifest = await loadProjectManifest(context.config?.root)
        projectManifestDependencies = projectManifest.dependencies
        addServerAllow(projectManifest.dependencies)
        for (const dependency of projectManifest.dependencies) {
            pluginContext.addWatchFile?.(dependency)
        }
        return projectManifest
    }

    return {
        name: 'master-css:local-compose',
        enforce: 'pre',
        async buildStart() {
            projectManifest = undefined
            projectManifestDependencies = []
        },
        async transform(code, id) {
            if (id.startsWith('\0')) return
            if (!isStyleCSSRequest(id)) return
            if (!hasLocalStyleDirectives(code)) return
            if (resolveMasterStyleSource(id, code, context.config?.root)) return

            const manifestResult = await loadComposeContext(this)
            const result = await transformLocalStyleCSS(id, code, {
                baseManifest: manifestResult.manifest,
                projectDir: context.config?.root
            })
            if (!result.transformed) return
            localComposeModules.add(id)
            for (const dependency of result.dependencies) {
                this.addWatchFile?.(dependency)
            }
            return {
                code: result.code,
                map: null
            }
        },
        async handleHotUpdate({ file, server }) {
            if (!projectManifestDependencies.includes(file)) return
            projectManifest = undefined
            projectManifestDependencies = []
            let handled = false
            let needsFullReload = false
            for (const moduleId of localComposeModules) {
                const module = server.moduleGraph.getModuleById(moduleId)
                handled ||= Boolean(module)
                needsFullReload ||= invalidateModule(module, server)
                if (module) await server.reloadModule(module)
            }
            if (needsFullReload) {
                server.ws.send({
                    type: 'full-reload',
                    path: '*',
                    triggeredBy: file
                })
            }
            if (handled) return []
        }
    }
}
