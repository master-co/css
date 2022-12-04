import path from 'path'
import log from 'aronlog'
import { default as defaultOptions, CompilerOptions, CompilerSource } from './options'
import MasterCSS, { extend } from '@master/css'
import { performance } from 'perf_hooks'
import type { Config } from '@master/css'
import { pathToFileURL } from 'url'
import fs from 'fs'

export default class MasterCSSCompiler {

    constructor(
        public options?: CompilerOptions
    ) {
        this.options = extend(defaultOptions, options)
        this.userConfigPath = path.join(process.cwd(), this.options.config || 'master.css.js')
        this.outputPath = path.join(process.cwd(), this.options.output.dir, this.options.output.name)
        this.initializing = this.reload()
    }

    userConfigPath: string
    outputPath: string
    initializing: Promise<any>
    css: MasterCSS
    extractions = new Set<string>()

    async reload() {
        let userConfig: Config
        try {
            if (require.cache?.[this.userConfigPath]) {
                delete require.cache[this.userConfigPath]
            }
            if (fs.existsSync(this.userConfigPath)) {
                const userConfigPath = pathToFileURL(this.userConfigPath).href
                const userConfigModule = await import(userConfigPath)
                userConfig = userConfigModule.default || userConfigModule
                log.info`${'master.css.js'} imported from ${userConfigPath}`
            } else {
                log.info`No master.css.js in the project root`
            }
            // eslint-disable-next-line no-empty
        } catch (err) {
            log.error(err)
        }
        this.css = new MasterCSS({ config: userConfig })
        this.extractions.clear()
    }

    extract({ name, content }: CompilerSource) {
        if (
            !name || !content
            || !this.options.accept?.({ content, name })
        ) {
            return []
        }
        const eachExtractions: string[] = []

        this.log('accepts', `  → ${path.relative(process.cwd(), name)}`)

        for (const eachNewExtraction of this.options.extract({ content, name }, this.css)) {
            if (this.extractions.has(eachNewExtraction)) {
                continue
            } else {
                this.extractions.add(eachNewExtraction)
                eachExtractions.push(eachNewExtraction)
            }
        }
        return eachExtractions
    }

    insert(extractions) {
        const p1 = performance.now()

        /* 根據類名尋找並插入規則 ( MasterCSS 本身帶有快取機制，重複的類名不會再編譯及產生 ) */
        for (const eachExtraction of extractions) {
            this.css.insert(eachExtraction)
        }

        const spent = Math.round((performance.now() - p1) * 1000)
        const validClasses = this.css.rules.map((rule) => rule.className)

        /* 印出 Master CSS 編譯時間 */
        log.info`${'Master'} process ${extractions.length} extractions in ${spent} µs ${this.css.rules.length} rules`
        log.info`${'Master'} extractions: ${extractions.join(' ')}`
        log.info`${'Master'} valid classes ${validClasses.length}: ${validClasses.join(' ')}`
        log.info`${'Master'} ${this.outputPath}`
    }

    log(name, content) {
        if (this.options.debug === true || Array.isArray(this.options.debug) && this.options.debug.includes(name)) {
            console.log(content)
        }
    }
}