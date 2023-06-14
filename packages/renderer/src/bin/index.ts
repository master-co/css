#!/usr/bin/env node

import { program } from 'commander'
import log from '@techor/log'
import fg from 'fast-glob'
import { renderHTML } from '@master/css'
import zlib from 'zlib'
import fs from 'fs'
import prettyBytes from 'pretty-bytes'
import prettyHartime from 'pretty-hrtime'
import exploreConfig from 'explore-config'

program.command('render', { isDefault: true })
    .description('Scans HTML and injects generated CSS rules')
    .argument('<source paths>', 'The path in glob patterns of the source of the HTML file')
    .option('-c --config', 'The source path of the Master CSS configuration', 'master.css.*')
    .option('-a --analyze', 'Analyze injected CSS and HTML size ( brotli ) without writing to file')
    .action(async function (filePatterns, options) {
        const sourcePaths = fg.sync(filePatterns)
        if (sourcePaths.length) {
            const config = exploreConfig(options.config)
            const renderStart = process.hrtime()
            const col1Width = sourcePaths
                .reduce((max: any, current: any) => {
                    if (current.length > max.length) {
                        return current
                    } else {
                        return max
                    }
                })
                .length
            log``
            log`  Source Files${' '.repeat(col1Width - 10)}CSS Size`
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
                    const c1Gap = ' '.repeat(col1Width - eachSourcePath.length + 10 - prettifiedCSSSize.length)
                    log.ok`**${eachSourcePath}**${c1Gap}${prettifiedCSSSize}`
                }))
            const renderTime = process.hrtime(renderStart)
            if (options.analyze) {
                log`  ${' '.repeat(col1Width + 2)}(Brotli)`
                log``
                log.success`**${sourcePaths.length}** files analyzed in ${prettyHartime(renderTime).replace(' ', '')}`
                log``
                log.i`The CSS output will be smaller because it doesn't yet consider the bytes shared with HTML.`
            } else {
                log`  ${' '.repeat(col1Width + 5)}(Raw)`
                log``
                log.success`**${sourcePaths.length}** files rendered in ${prettyHartime(renderTime).replace(' ', '')}`
            }
        } else {
            log.i`No **${filePatterns}** files found`
        }
    })

program.parse(process.argv)