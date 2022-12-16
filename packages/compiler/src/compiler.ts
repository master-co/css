import path from 'path'
import log from 'aronlog'
import { default as defaultOptions, CompilerOptions } from './options'
import MasterCSS, { extend } from '@master/css'
import { performance } from 'perf_hooks'
import type { Config } from '@master/css'
import fs from 'fs'
import fg from 'fast-glob'
import minimatch from 'minimatch'
import { pathToFileURL } from 'url'

export default class MasterCSSCompiler {

    constructor(
        public options?: CompilerOptions
    ) {
        this.options = extend(defaultOptions, options)
    }

    css: MasterCSS
    extractions = new Set<string>()
    readonly moduleId = 'master.css'
    readonly resolvedModuleId = '\0' + this.moduleId
    readonly moduleHMREvent = `HMR:${this.moduleId}`

    async init() {
        this.extractions.clear()
        this.css = new MasterCSS({ config: await this.readConfig() })
        this.compile()
        return this
    }

    compile() {
        /* 插入指定的固定 class */
        if (this.options.fixedClasses?.length)
            for (const eachFixedClass of this.options.fixedClasses) {
                this.css.insert(eachFixedClass)
            }
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

    extract(name: string, content: string): string[] {
        if (!name || !content || !this.checkSourcePath(name)) {
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
        if (eachExtractions.length)
            log.info`${'extract'} ${eachExtractions.length.toString()} potential ${`.${path.relative(this.options.cwd, name)}.`}`

        if (this.options.debug) {
            if (eachExtractions.length) log.info`${'extract'} ${`.${eachExtractions.join(' ')}.`}`
        }
        return eachExtractions
    }

    insert(name: string, content: string): boolean {
        let extractions = this.extract(name, content)
        if (!extractions.length) {
            return false
        }
        const p1 = performance.now()
        /* 根據類名尋找並插入規則 ( MasterCSS 本身帶有快取機制，重複的類名不會再編譯及產生 ) */
        let validCount = 0
        /* 排除指定的 class */
        if (this.options.ignoredClasses?.length)
            extractions = extractions.filter((eachExtraction) => {
                for (const eachIgnoreClass of this.options.ignoredClasses) {
                    if (typeof eachIgnoreClass === 'string') {
                        if (eachIgnoreClass === eachExtraction) return false
                    } else if (eachIgnoreClass.test(eachExtraction)) {
                        return false
                    }
                }
                return true
            })
        for (const eachExtraction of extractions) {
            if (this.css.insert(eachExtraction)) {
                validCount++
            }
        }
        const spent = Math.round((performance.now() - p1) * 100) / 100
        log.info`${'compile'} ${`+${validCount}+`} valid ${`.in.`} ${`*${spent}ms*`} ${`.(${this.css.rules.length} rules).`}`
        if (this.options.debug) {
            if (this.css.rules.length) log.info`${'compile'} ${`${Object.keys(this.css.ruleOfClass).join(' ')}`}`
        }
        console.log('')
        return true
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
        const read = async (importPath: string) => {
            if (require.cache?.[this.configPath]) {
                delete require.cache[this.configPath]
            }
            if (this.hasConfig) {
                const userConfigModule = await import(importPath)
                customConfig = userConfigModule.default || userConfigModule
                console.log('')
                log.ok`import ${`*${path.relative(this.options.cwd, this.configPath)}*`} configuration`
            } else {
                log.info`${'read'} No config file found ${`.${this.configPath}.`}`
            }
            console.log('')
        }
        try {
            await read(pathToFileURL(this.configPath).href + '?' + Date.now())
        } catch (err) {
            // 解決於 Jest 於 file:/// 的問題
            if (err.toString().includes('Cannot find module')) {
                await read(this.configPath)
            } else {
                log.error(err)
            }
        }
        return customConfig
    }

    checkSourcePath(name: string): boolean {
        for (const eachIncludePattern of this.options.include) {
            if (!minimatch(name, eachIncludePattern)) return false
        }
        for (const eachExcludePattern of this.options.exclude) {
            if (minimatch(name, eachExcludePattern)) return false
        }
        return true
    }

    get hasConfig(): boolean {
        return fs.existsSync(this.configPath)
    }

    get configPath(): string {
        const { cwd, config } = this.options
        const fileName = fg.sync(config, { cwd })[0]
        return fileName ? path.resolve(cwd, fileName) : ''
    }
}