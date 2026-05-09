import { loadConfig } from '@master/css-explore-config'
import path from 'node:path'
import type { PluginContext } from '../core'

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
    const extractor = context.extractor
    const generatedCSS = extractor.css.text
    const configPath = extractor.resolvedConfigPath

    if (!configPath || path.extname(configPath) !== '.css') {
        return generatedCSS
    }

    const classes = new Set([
        ...extractor.validClasses,
        ...extractor.usedNativeClasses,
        ...(extractor.options.includeClasses || [])
    ])
    const result = await loadConfig(configPath, { classes: [...classes] })
    return result.css || generatedCSS
}
