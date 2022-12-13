import path from 'path'
import log from 'aronlog'
import { default as defaultOptions, CompilerOptions, CompilerSource } from './options'
import MasterCSS, { extend } from '@master/css'
import { performance } from 'perf_hooks'
import type { Config } from '@master/css'
import fs from 'fs'
import fg from 'fast-glob'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export default class MasterCSSCompiler {

    constructor(
        public options?: CompilerOptions
    ) {
        this.options = extend(defaultOptions, options)
        const { cwd, config, output } = this.options
        this.userConfigPath = path.join(cwd, config || 'master.css.js')
        this.outputPath = path.resolve(cwd, output.dir, output.name)
        this.publicURL = path.join(output.dir, output.name)
        this.initializing = this.reload()
    }

    userConfigPath: string
    outputPath: string
    publicURL: string
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
                const userConfigModule = await import(this.userConfigPath)
                userConfig = userConfigModule.default || userConfigModule
                log.info`${'master.css.js'} imported from ${this.userConfigPath}`
            } else {
                log.info`No master.css.js in the project root`
            }
            // eslint-disable-next-line no-empty
        } catch (err) {
            log.error(err)
        }
        this.css = new MasterCSS({ config: userConfig })
        this.extractions.clear()
        if (this.options.additions?.length) {
            fg.sync(this.options.additions, { cwd: this.options.cwd })
                .forEach((eachFilePath) => {
                    const eachFileContent = fs.readFileSync(
                        path.resolve(this.options.cwd, eachFilePath),
                        { encoding: 'utf-8' }
                    ).toString()
                    this.insert({
                        name: eachFilePath,
                        content: eachFileContent
                    })
                })
        }
    }

    extract({ name, content }: CompilerSource) {
        if (
            !name || !content
            || !this.options.accept?.({ content, name })
        ) {
            return []
        }
        const eachExtractions: string[] = []

        log.info`${'Master'} extract ${`.${path.relative(this.options.cwd, name)}.`}`

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

    insert({ name, content }: CompilerSource): boolean {
        const extractions = this.extract({ name, content })
        if (!extractions.length) {
            return false
        }
        this.insertExtractions(extractions)
        return true
    }

    insertExtractions(extractions: string[]) {
        const p1 = performance.now()
        /* 根據類名尋找並插入規則 ( MasterCSS 本身帶有快取機制，重複的類名不會再編譯及產生 ) */
        for (const eachExtraction of extractions) {
            this.css.insert(eachExtraction)
        }
        const spent = Math.round((performance.now() - p1) * 1000)
        log.info`${'Master'} ${`*${extractions.length}*`} extractions in ${spent}µs`
        log.info`${'Master'} total ${`*${this.css.rules.length}*`} rules`
        if (this.options.debug) {
            const validClasses = this.css.rules.map((rule) => rule.className)
            log.info`${'Master'} extractions: ${`.${extractions.join(' ')}.`}`
            log.info`${'Master'} ${`+${validClasses.length}+`} valid classes: ${`+${validClasses.join(' ')}+`}`
        }
        console.log()
    }
}