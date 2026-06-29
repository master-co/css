import { readFileSync } from 'node:fs'
import {
    cleanStyleRequest,
    resolveStyleCSSImportGraph
} from '@master/css-stylesheet'

interface DependencyContext {
    addDependency?: (file: string) => void
}

function addDependency(context: DependencyContext, dependencies: Set<string>, dependency: string) {
    const cleanDependency = cleanStyleRequest(dependency)
    if (dependencies.has(cleanDependency)) return
    dependencies.add(cleanDependency)
    context.addDependency?.(cleanDependency)
}

export function addStyleCSSDependencies(
    context: DependencyContext,
    resourcePath: string,
    source?: string,
    projectDir?: string
) {
    const dependencies = new Set<string>()
    const filename = cleanStyleRequest(resourcePath)
    addDependency(context, dependencies, filename)

    let resolvedSource = source
    if (resolvedSource === undefined) {
        try {
            resolvedSource = readFileSync(filename, 'utf-8')
        } catch {
            return [...dependencies]
        }
    }

    try {
        const graph = resolveStyleCSSImportGraph(filename, resolvedSource, projectDir, {
            expandMasterCSSPackage: false
        })
        for (const dependency of graph.dependencies) {
            addDependency(context, dependencies, dependency)
        }
    } catch {
        // Keep the direct file dependency so the next valid edit can rerun the loader.
    }

    return [...dependencies]
}
