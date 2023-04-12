import upath from 'upath'
import { default as defaultOptions, Options } from './options'
import MasterCSS, { Rule } from '@master/css'
import type { Config } from '@master/css'
import extract from './extract'
import fs from 'fs'
import fg from 'fast-glob'
import minimatch from 'minimatch'
import Techor, { options as techorOptions } from 'techor'
import log, { chalk } from '@techor/log'
import stylelint from 'stylelint'
import { extend } from '@techor/extend'
import crossImport from 'cross-import'

export class MasterCSSCompiler extends Techor<Options, Config> {

    css: MasterCSS
    extractions = new Set<string>()
    validExtractions = new Set<string>()
    invalidExtractions = new Set<string>()

    get resolvedModuleId() {
        return '\0' + this.options.module
    }

    get moduleHMREvent() {
        return `HMR:${this.options.module}`
    }

    constructor(
        public customOptions?: Options
    ) {
        super(defaultOptions, customOptions)
        this.init(customOptions)
    }

    private init(customOptions: Options = this.customOptions) {
        this.options = extend(techorOptions, defaultOptions, this.readOptions(), customOptions)
        this.css = new MasterCSS({
            ...(typeof this.options.config === 'object' ? this.options.config : (this.readConfig() || {})),
            observe: false
        })
    }

    logOptionsFound = (optionsPath: string) => log.ok`**${optionsPath}** file found`
    logOptionsNotFound = (optionsPath: string) => log.i`No **${optionsPath}** file found`

    readOptions(key = 'options'): Options | any {
        const { cwd } = this.options
        if (typeof this.options.path === 'object') {
            return this.options.path as Options
        }
        let userOptions: Options
        try {
            const optionsPath = this.optionsPath
            if (optionsPath) {
                const userOptionsModule = crossImport(optionsPath, { cwd })
                userOptions = (key ? userOptionsModule[key] : undefined) || userOptionsModule.default || userOptionsModule
                this.logOptionsFound(optionsPath)
            } else {
                this.logOptionsNotFound(this.options.path)
            }
        } catch (err) {
            log.error(err)
        }
        return userOptions
    }

    get optionsPath(): string {
        if (!this.options.path || typeof this.options.path !== 'string') {
            return
        }
        return fg.sync(this.options.path, { cwd: this.options.cwd })[0]
    }

    get resolvedOptionsPath() {
        const optionsPath = this.optionsPath
        return optionsPath ? upath.resolve(this.options.cwd, optionsPath) : ''
    }

    async refresh(customOptions: Options = this.customOptions) {
        this.extractions.clear()
        this.validExtractions.clear()
        this.invalidExtractions.clear()
        console.log('')
        this.init(customOptions)
        await this.compile()
        return this
    }

    async compile() {
        /* 插入指定的固定 class */
        if (this.options.classes?.fixed?.length)
            for (const eachFixedClass of this.options.classes.fixed) {
                this.css.insert(eachFixedClass)
            }
        await Promise.all(
            this.sources
                .map(async (eachSourcePath) => {
                    const eachFileContent = fs.readFileSync(
                        upath.resolve(this.options.cwd, eachSourcePath),
                        { encoding: 'utf-8' }
                    ).toString()
                    await this.insert(eachSourcePath, eachFileContent)
                })
        )
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
        return eachExtractions
    }

    async insert(name: string, content: string): Promise<boolean> {
        let extractions = this.extract(name, content)

        if (!extractions.length) {
            return false
        }

        /**
         * 排除已驗證為 invalid 的 extraction
         */
        if (this.invalidExtractions.size) {
            extractions = extractions.filter((eachExtraction) => !this.invalidExtractions.has(eachExtraction))
        }

        /**
         * 排除已驗證為 valid 的 extraction
         * TODO: 未來如果有加入清除機制，需注意意外排除掉之前已驗證過為 valid 的 extraction
         */
        if (this.validExtractions.size) {
            extractions = extractions.filter((eachExtraction) => !this.validExtractions.has(eachExtraction))
        }

        /* 排除指定的 class */
        if (this.options.classes?.ignored?.length)
            extractions = extractions.filter((eachExtraction) => {
                for (const eachIgnoreClass of this.options.classes.ignored) {
                    if (typeof eachIgnoreClass === 'string') {
                        if (eachIgnoreClass === eachExtraction) return false
                    } else if (eachIgnoreClass.test(eachExtraction)) {
                        return false
                    }
                }
                return true
            })

        let time = process.hrtime()
        /* 根據類名尋找並插入規則 ( MasterCSS 本身帶有快取機制，重複的類名不會再編譯及產生 ) */
        const validExtractions = []

        await Promise.all(
            extractions
                .map(async (eachExtraction) => {
                    const validRules = await this.createRules(eachExtraction)
                    if (validRules.length) {
                        this.css.insertRules(validRules)
                        validExtractions.push(eachExtraction)
                        this.validExtractions.add(eachExtraction)
                    } else {
                        this.invalidExtractions.add(eachExtraction)
                    }
                })
        )
        time = process.hrtime(time)
        const spent = Math.round(((time[0] * 1e9 + time[1]) / 1e6) * 10) / 10

        if (extractions.length) {
            console.log('')
            log`**${upath.relative(this.options.cwd, name)}**`
            log`[extract] ${extractions.length} potential`
        }

        if (this.css.rules.length) {
            const excludedClasses = validExtractions.filter((eachValidExtraction) => !extractions.includes(eachValidExtraction))
            if (excludedClasses.length) {
                log`[exclude] ${excludedClasses.length} unknown ${excludedClasses}`
            }
            log`[compile] +${validExtractions.length}+ valid inserted ${chalk.gray('in')} ${spent}ms ${validExtractions}`
            log`[virtual] ${this.css.rules.length} total ${chalk.gray('in')} ${this.options.module}`
        }

        return true
    }

    async createRules(extraction: string): Promise<Rule[]> {
        /**
         * 藉由 stylelint 驗證 CSS 規則是否合法，因 AOT 的提取物較不可靠
         */
        const validRules = (await Promise.all(
            this.css.create(extraction)
                .map(async (eachRule: Rule) => {
                    const isValid = (await stylelint.lint({
                        code: eachRule.text,
                        cache: false,
                        config: {
                            rules: {
                                'color-no-invalid-hex': true,
                                'named-grid-areas-no-invalid': true,
                                'at-rule-no-unknown': true,
                                'function-no-unknown': true,
                                'media-feature-name-no-unknown': true,
                                'property-no-unknown': true,
                                'selector-pseudo-class-no-unknown': true,
                                'selector-pseudo-element-no-unknown': true,
                                'selector-type-no-unknown': true,
                                'unit-no-unknown': true
                            }
                        }
                    })).errored
                    return isValid ? null : eachRule
                })
        ))
            .filter((eachRule) => eachRule)

        return validRules
    }

    get sources(): string[] {
        const { include, exclude, sources, cwd } = this.options
        const sourcePaths = fg.sync(include, {
            cwd,
            ignore: exclude
        })
        if (sources?.length) {
            sourcePaths
                .push(
                    ...fg.sync(sources, { cwd })
                )
        }
        return sourcePaths.filter((eachSourcePath) => !!eachSourcePath)
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
