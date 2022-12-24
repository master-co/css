import upath from 'upath'
import { default as defaultOptions, Options } from './options'
import MasterCSS from '@master/css'
import { performance } from 'perf_hooks'
import type { Config } from '@master/css'
import extract from './extract'
import fs from 'fs'
import fg from 'fast-glob'
import minimatch from 'minimatch'
import Techor from 'techor'
import log, { chalk } from '@techor/log'

export default class MasterCSSCompiler extends Techor<Options, Config> {

    constructor(
        options?: Options
    ) {
        super(defaultOptions, options)
        this.init()
    }

    css: MasterCSS
    extractions = new Set<string>()
    readonly moduleId = 'master.css'
    readonly resolvedModuleId = '\0' + this.moduleId
    readonly moduleHMREvent = `HMR:${this.moduleId}`

    init() {
        this.extractions.clear()
        console.log('')
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
        for (const eachNewExtraction of extract({ content, name }, this.css)) {
            if (this.extractions.has(eachNewExtraction)) {
                continue
            } else {
                this.extractions.add(eachNewExtraction)
                eachExtractions.push(eachNewExtraction)
            }
        }
        if (eachExtractions.length) {
            console.log('')
            log`**${upath.relative(this.options.cwd, name)}** ..${upath.resolve(this.options.cwd, name)}..`
            log`[extract] ${eachExtractions.length} potential`
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
        const validExtractions = []
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
                validExtractions.push(eachExtraction)
            }
        }
        if (this.css.rules.length) {
            const spent = Math.round((performance.now() - p1) * 100) / 100
            const excludedClasses = validExtractions.filter((eachValidExtraction) => !extractions.includes(eachValidExtraction))
            if (excludedClasses.length) {
                log`[exclude] ${excludedClasses.length} unknow ${excludedClasses}`
            }
            log`[compile] +${validExtractions.length}+ valid inserted ${chalk.gray('in')} ${spent}ms ${validExtractions}`
            log`[virtual] ${this.css.rules.length} total ${chalk.gray('in')} ${this.moduleId}`
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

    get config(): Config {
        return this.css.config
    }
}