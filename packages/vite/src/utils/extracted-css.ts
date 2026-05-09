import { loadConfig } from '@master/css-explore-config'
import { createCSS, extendConfig } from '@master/css'
import path from 'node:path'
import type { PluginContext } from '../core'
import { compileStyleCSS } from './style-css'

function getNativeCSS(result: { css?: string, generatedCSS?: string, nativeCSS?: string }): string {
    if (result.nativeCSS !== undefined) return result.nativeCSS
    const css = result.css || ''
    const generatedCSS = result.generatedCSS || ''
    if (generatedCSS && css.endsWith(generatedCSS)) {
        return css.slice(0, -generatedCSS.length).trim()
    }
    return css
}

function getExtractorClasses(context: PluginContext): string[] {
    const extractor = context.extractor
    return [...new Set([
        ...(extractor.latentClasses || []),
        ...(extractor.validClasses || []),
        ...(extractor.usedNativeClasses || []),
        ...(extractor.options.includeClasses || [])
    ])]
}

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
    const extractor = context.extractor
    const classes = getExtractorClasses(context)
    const configPath = extractor.resolvedConfigPath
    if (!context.styleCSSSources?.size && !configPath) {
        return extractor.css.text
    }
    const styleResults = await Promise.all(
        Array.from(context.styleCSSSources || [])
            .map(([id, source]) => compileStyleCSS(id, source, { classes }))
    )
    const styleConfigs = styleResults.map((result) => result.config)
    let config = extractor.config
    const nativeCSS = styleResults.map(getNativeCSS).filter(Boolean)

    if (configPath) {
        const configResult = await loadConfig(configPath, { classes })
        config = configResult.config
        if (path.extname(configPath) === '.css') {
            const configNativeCSS = getNativeCSS(configResult)
            if (configNativeCSS) nativeCSS.push(configNativeCSS)
        }
    }

    const css = createCSS(extendConfig(...styleConfigs, config))
    for (const className of classes) {
        css.add(className)
    }
    return [...nativeCSS, css.text].filter(Boolean).join('\n\n')
}
