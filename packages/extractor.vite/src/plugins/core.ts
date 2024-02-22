import { CSSExtractor } from '@master/css-extractor'
import type { Options } from '@master/css-extractor'
import type { Plugin } from 'vite'
import type { Pattern } from 'fast-glob'
import PreInsertionPlugin from './pre-insertion'
import VirtualCSSModulePlugins from './virtual-css-module'

export default function CSSExtractorPlugin(
    customOptions?: Options | Pattern,
    cwd = process.cwd()
): Plugin[] {
    const extractor = new CSSExtractor(customOptions, cwd)
    extractor.on('init', (options: Options) => {
        options.include = []
    })
    extractor.init()
    return [
        PreInsertionPlugin(extractor),
        ...VirtualCSSModulePlugins(extractor),
    ]
}