import upath from 'upath'
import log from 'aronlog'
import { default as defaultOptions, CompilerOptions } from './options'
import MasterCSS, { extend } from '@master/css'
import { performance } from 'perf_hooks'
import type { Config } from '@master/css'
import fs from 'fs'
import fg from 'fast-glob'
import minimatch from 'minimatch'
import crossImport from 'cross-import'

export default class MasterCSSCompiler {

    constructor(
        public options?: CompilerOptions
    ) {
        this.options = extend(defaultOptions, options)
        this.init()
    }

    css: MasterCSS
    extractions = new Set<string>()
    readonly moduleId = 'master.css'
    readonly resolvedModuleId = '\0' + this.moduleId
    readonly moduleHMREvent = `HMR:${this.moduleId}`

    init() {
        this.extractions.clear()
        this.css = new MasterCSS({ config: this.readConfig() })
        this.compile()
        return this
    }

    compile() {
        /* 插入指定的固定 class */
        if (this.options.fixedClasses?.length)
            for (const eachFixedClass of this.options.fixedClasses) {
                this.css.insert(eachFixedClass)
            }
        this.sources
            .forEach((eachSourcePath) => {
                const eachFileContent = fs.readFileSync(
                    upath.resolve(this.options.cwd, eachSourcePath),
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
            log.info`${'extract'} ${eachExtractions.length.toString()} potential ${`.${upath.relative(this.options.cwd, name)}.`}`

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
        return true
    }

    get sources(): string[] {
        const { include, exclude, sources } = this.options
        const sourcePaths = fg.sync(include, {
            cwd: this.options.cwd,
            ignore: exclude
        })
        if (sources?.length) {
            sourcePaths.push(
                ...fg.sync(sources, { cwd: this.options.cwd })
            )
        }
        return sourcePaths
    }

    readConfig(): Config {
        const { config, cwd } = this.options
        if (typeof config === 'object') {
            return config as Config
        }
        let userConfig: Config
        try {
            const configPath = this.configPath
            if (configPath) {
                const userConfigModule = crossImport(configPath, { cwd })
                userConfig = userConfigModule.default || userConfigModule
                log.ok`import ${`*${configPath}*`} configuration`
            } else {
                log.info`${'read'} No config file found ${`.${this.options.config}.`}`
            }
        } catch (err) {
            log.error(err)
        }
        return userConfig
    }

    checkSourcePath(name: string): boolean {
        const { include, exclude, sources } = this.options
        for (const eachSource of sources) {
            if (minimatch(name, eachSource)) return true
        }
        for (const eachIncludePattern of include) {
            if (!minimatch(name, eachIncludePattern)) return false
        }
        for (const eachExcludePattern of exclude) {
            if (minimatch(name, eachExcludePattern)) return false
        }
        return true
    }

    get configPath(): string {
        const { cwd, config } = this.options
        if (!config || typeof config !== 'string') {
            return
        }
        return fg.sync(config, { cwd })[0]
    }

    get resolvedConfigPath() {
        const configPath = this.configPath
        return configPath ? upath.resolve(this.options.cwd, configPath) : ''
    }

    get config(): Config {
        return this.css.config
    }
}