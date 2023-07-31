
import log from '@techor/log'
import type { Pattern } from 'fast-glob'
import { renderHTML } from '@master/css'
import zlib from 'zlib'
import fs from 'fs'
import prettyBytes from 'pretty-bytes'
import prettyHartime from 'pretty-hrtime'
import exploreConfig from 'explore-config'
import { explorePathsSync } from '@techor/glob'

module.exports = async function action(filePatterns: Pattern | Pattern[], options: any = {
    config: 'master.css.*'
}) {
    const sourcePaths = explorePathsSync(filePatterns)
    if (sourcePaths.length) {
        const config = typeof options.config === 'string'
            ? exploreConfig(options.config)
            : undefined
        const renderStart = process.hrtime()
        const col1Width = Math.max(
            sourcePaths.reduce((max: any, current: any) => {
                if (current.length > max.length) {
                    return current
                } else {
                    return max
                }
            })
            .length + 10,
            20
        )
        const col2Width = 8
        log``
        log`${'  Source Files'.padEnd(col1Width)}${'CSS Size'.padStart(col2Width)}`
        await Promise.all(sourcePaths
            .map(async (eachSourcePath) => {
                const content = fs.readFileSync(eachSourcePath, { encoding: 'utf-8' })
                const renderedContent = renderHTML(content, config)
                let renderedCSSText = ''
                renderedContent.replace(/<style id="master">(.*?)<\/style>/, (_, text) => {
                    renderedCSSText = text
                    return ''
                })
                const renderedCSSSize = renderedCSSText
                    ? (options.analyze
                        ? zlib.brotliCompressSync(renderedCSSText).length
                        : renderedCSSText.length)
                    : 0
                const prettifiedCSSSize = prettyBytes(renderedCSSSize, { space: false })
                if (!options.analyze) {
                    if (content !== renderedContent) {
                        fs.writeFileSync(eachSourcePath, renderedContent)
                    }
                }
                log.ok`**${eachSourcePath}**${' '.repeat(col1Width - eachSourcePath.length - 2)}${prettifiedCSSSize.padStart(col2Width)}`
            }))
        const renderTime = process.hrtime(renderStart)
        if (options.analyze) {
            log`${' '.repeat(col1Width)}${'(Brotli)'.padStart(col2Width)}`
            log``
            log.success`**${sourcePaths.length}** files analyzed in ${prettyHartime(renderTime).replace(' ', '')}`
            log``
            log.i`The CSS output will be smaller because it doesn't yet consider the bytes shared with HTML.`
        } else {
            log`${' '.repeat(col1Width)}${'(Raw)'.padStart(col2Width)}`
            log``
            log.success`**${sourcePaths.length}** files rendered in ${prettyHartime(renderTime).replace(' ', '')}`
        }
    } else {
        log.i`No **${filePatterns}** files found`
    }
}