import path from 'path'
import log from 'aronlog'
import { default as defaultOptions, CompilerOptions } from './options'
import MasterCSS, { extend } from '@master/css'
import { performance } from 'perf_hooks'
import type { Config } from '@master/css'
import fs from 'fs'
import fg from 'fast-glob'
import { createRequire } from 'module'
import minimatch from 'minimatch'

const require = createRequire(import.meta.url)

export default class MasterCSSCompiler {

    constructor(
        public options?: CompilerOptions
    ) {
        this.options = extend(defaultOptions, options)
    }

    css: MasterCSS
    extractions = new Set<string>()

    async init() {
        this.extractions.clear()
        this.css = new MasterCSS({ config: await this.readConfig() })
        this.compile()
        return this
    }

    compile() {
        this.readSourcePaths()
            .forEach((eachSourcePath) => {
                const eachFileContent = fs.readFileSync(
                    path.resolve(this.options.cwd, eachSourcePath),
                    { encoding: 'utf-8' }
                ).toString()
                this.insert(eachSourcePath, eachFileContent)
            })
        return this
    }

    extract(name: string, content: string) {
        if (!name || !content || !this.accept(name)) {
            return []
        }
        const eachExtractions: string[] = []
        for (const eachNewExtraction of this.options.extract({ content, name }, this.css)) {
            if (this.extractions.has(eachNewExtraction)) {
                continue
            } else {
                this.extractions.add(eachNewExtraction)
                eachExtractions.push(eachNewExtraction)
            }
        }
        log.info`${'extract'} ${eachExtractions.length.toString()} potential ${`.from ${path.relative(this.options.cwd, name)}.`}`
        return eachExtractions
    }

    insert(name: string, content: string): boolean {
        const extractions = this.extract(name, content)
        if (!extractions.length) {
            return false
        }
        this.insertExtractions(extractions)
        return true
    }

    insertExtractions(extractions: string[]) {
        const p1 = performance.now()
        /* 根據類名尋找並插入規則 ( MasterCSS 本身帶有快取機制，重複的類名不會再編譯及產生 ) */
        let validCount = 0
        for (const eachExtraction of extractions) {
            if (this.css.insert(eachExtraction)) {
                validCount++
            }
        }
        const spent = Math.round((performance.now() - p1) * 100) / 100
        log.info`${'compile'} ${`*${validCount}*`} valid ${`.in.`} ${`*${spent}ms*`} ${`.(${this.css.rules.length} rules).`}`
    }

    readSourcePaths(): string[] {
        const { include, exclude } = this.options
        return fg.sync(include, {
            cwd: this.options.cwd,
            ignore: exclude
        })
    }

    async readConfig(): Promise<Config> {
        let customConfig: Config
        try {
            if (require.cache?.[this.customConfigPath]) {
                delete require.cache[this.customConfigPath]
            }
            if (this.hasCustomConfig) {
                const userConfigModule = await import(this.customConfigPath)
                customConfig = userConfigModule.default || userConfigModule
                console.log()
                log.info`${'import'} custom config ${`.from ${path.relative(this.options.cwd, this.customConfigPath)}.`}`
            } else {
                log.info`No master.css.js in the project root`
            }
            // eslint-disable-next-line no-empty
        } catch (err) {
            log.error(err)
        }
        return customConfig
    }

    accept(name: string) {
        for (const eachIncludePattern of this.options.include) {
            if (!minimatch(name, eachIncludePattern)) return false
        }
        for (const eachExcludePattern of this.options.exclude) {
            if (minimatch(name, eachExcludePattern)) return false
        }
        return true
    }

    get hasCustomConfig() {
        return fs.existsSync(this.customConfigPath)
    }

    get customConfigPath() {
        const { cwd, config } = this.options
        return path.join(cwd, config || 'master.css.js')
    }
}