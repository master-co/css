import log from '@techor/log'
import type { Pattern } from 'fast-glob'
import prettyHartime from 'pretty-hrtime'
import { explorePathsSync } from '@techor/glob'
import exploreConfig from 'explore-config'
import { readFile, writeFile, writeFileSync } from 'fs'
import { brotliCompressSync } from 'zlib'
import bytes from 'bytes'
import { render } from '@master/css-server'

module.exports = async function action(filePatterns: Pattern | Pattern[], options: any = {
    config: 'master.css.*'
}) {
    const sourcePaths = explorePathsSync(filePatterns)
    if (sourcePaths.length) {
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
        const config = typeof options.config === 'string'
            ? exploreConfig(options.config)
            : undefined
        log``
        log`${'  Source Files'.padEnd(col1Width)}${'CSS Size'.padStart(col2Width)}`
        await Promise.all(sourcePaths
            .map(async (filename) => new Promise<void>((resolve, reject) => {
                readFile(filename, { encoding: 'utf-8' }, (err, content) => {
                    if (err) reject(err)
                    const { html, css } = render(content, config)
                    const renderedCSSText = css?.text
                    const renderedCSSSize = renderedCSSText
                        ? (options.analyze
                            ? brotliCompressSync(renderedCSSText).length
                            : renderedCSSText.length)
                        : 0
                    if (!options.analyze) {
                        if (content !== html) {
                            writeFileSync(filename, html)
                        }
                    }
                    const prettifiedCSSSize = bytes(renderedCSSSize, { space: false })
                    log.ok`**${filename}**${' '.repeat(col1Width - filename.length - 2)}${prettifiedCSSSize.padStart(col2Width)}`
                    resolve()
                })
            })))
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