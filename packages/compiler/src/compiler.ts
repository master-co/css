import upath from 'upath'
import { default as defaultOptions, Options } from './options'
import MasterCSS, { Rule } from '@master/css'
import { performance } from 'perf_hooks'
import type { Config } from '@master/css'
import extract from './extract'
import fs from 'fs'
import fg from 'fast-glob'
import minimatch from 'minimatch'
import Techor from 'techor'
import log, { chalk } from '@techor/log'
import stylelint from 'stylelint'
import extend from 'to-extend'

export default class MasterCSSCompiler extends Techor<Options, Config> {

    css: MasterCSS
    extractions = new Set<string>()

    get resolvedModuleId() {
        return '\0' + this.options.module
    }

    get moduleHMREvent() {
        return `HMR:${this.options.module}`
    }

    constructor(
        options?: Options
    ) {
        super(defaultOptions, options)
        const definition = this.readConfig(null)
        this.options = extend(this.options, definition?.compilerOptions, options)
        this.css = definition?.css ?? new MasterCSS(definition?.config)
    }

    async refresh() {
        this.extractions.clear()
        console.log('')
        this.css = new MasterCSS(this.readConfig())
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
        const p1 = performance.now()
        /* 根據類名尋找並插入規則 ( MasterCSS 本身帶有快取機制，重複的類名不會再編譯及產生 ) */
        const validExtractions = []

        await Promise.all(
            extractions
                .map(async (eachExtraction) => {
                    const validRules = await this.createRules(eachExtraction)
                    if (validRules.length) {
                        this.css.insertRules(validRules)
                        validExtractions.push(eachExtraction)
                    }
                })
        )

        const spent = Math.round((performance.now() - p1) * 100) / 100

        if (extractions.length) {
            console.log('')
            log`**${upath.relative(this.options.cwd, name)}**`
            log`[extract] ${extractions.length} potential`
        }

        if (this.css.rules.length) {
            const excludedClasses = validExtractions.filter((eachValidExtraction) => !extractions.includes(eachValidExtraction))
            if (excludedClasses.length) {
                log`[exclude] ${excludedClasses.length} unknow ${excludedClasses}`
            }
            log`[compile] +${validExtractions.length}+ valid inserted ${chalk.gray('in')} ${spent}ms ${validExtractions}`
            log`[virtual] ${this.css.rules.length} total ${chalk.gray('in')} ${this.options.module}`
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

        return true
    }

    async createRules(extraction: string): Promise<Rule[]> {
        /**
         * 藉由 stylelint 驗證 CSS 規則是否合法，因 AOT 的提取物較不可靠
         */
        return (await Promise.all(
            this.css.create(extraction)
                .map(async (eachRule: Rule) =>
                    (await stylelint.lint({
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
                        ? null
                        : eachRule
                )
        ))
            .filter((eachRule) => eachRule)
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