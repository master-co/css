import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { loadProjectManifest } from '@master/css-project/manifest'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import {
    collectStyleCSSDependencies,
    hasLocalStyleDirectives,
    isStyleCSSRequest,
    resolveMasterStyleSource,
    transformLocalStyleCSS
} from '@master/css-stylesheet'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
import { includesFile } from '../utils/path'

function invalidateModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
    if (!module) return false
    server.moduleGraph.invalidateModule(module)
    return true
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
        const root = context.config?.root
        const entries = await findCSSManifestEntryFiles(root)
        const dependencies = new Set<string>()
        for (const entry of entries) {
            for (const dependency of collectStyleCSSDependencies(entry, undefined, root)) {
                dependencies.add(dependency)
            }
        }
        projectManifestDependencies = [...dependencies]
        addServerAllow(projectManifestDependencies)
        for (const dependency of projectManifestDependencies) {
            pluginContext.addWatchFile?.(dependency)
        }
        projectManifest = await loadProjectManifest(root, { entries })
        for (const dependency of projectManifest.dependencies) {
            if (dependencies.has(dependency)) continue
            dependencies.add(dependency)
            pluginContext.addWatchFile?.(dependency)
        }
        projectManifestDependencies = [...dependencies]
        addServerAllow(projectManifestDependencies)
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

            const dependencies = new Set(collectStyleCSSDependencies(id, code, context.config?.root))
            for (const dependency of dependencies) {
                this.addWatchFile?.(dependency)
            }
            const manifestResult = await loadComposeContext(this)
            const result = await transformLocalStyleCSS(id, code, {
                baseManifest: manifestResult.manifest,
                projectDir: context.config?.root
            })
            if (!result.transformed) return
            localComposeModules.add(id)
            for (const dependency of result.dependencies) {
                if (dependencies.has(dependency)) continue
                this.addWatchFile?.(dependency)
            }
            return {
                code: result.code,
                map: null
            }
        },
        async handleHotUpdate({ file, server }) {
            if (!includesFile(projectManifestDependencies, file)) return
            projectManifest = undefined
            projectManifestDependencies = []
            let handled = false
            for (const moduleId of localComposeModules) {
                const module = server.moduleGraph.getModuleById(moduleId)
                handled ||= Boolean(module)
                invalidateModule(module, server)
                if (module) await server.reloadModule(module)
            }
            if (handled) return []
        }
    }
}
