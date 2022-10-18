import path from 'path'
import chalk from 'chalk'
import defaultOptions from './options'
import { extend } from '../utils/extend'
import MasterCSS from '../css'
import configure from '../configure'

export default class MasterCSSCompiler {

    constructor(
        public options
    ) {
        this.options = extend(defaultOptions, options)
        let userConfig
        try {
            userConfig = require(path.resolve(process.cwd(), options.config || './master.css.js'));
            // eslint-disable-next-line no-empty
        } catch (err) { }
        this.css = new MasterCSS(configure(userConfig))
    }

    css
    extractions = new Set()

    extract({ name, source }) {
        if (
            !name || !source
            || !this.options.accept?.({ name })
        ) {
            return []
        }
        const eachExtractions = []

        this.log('accepts', `  → ${path.relative(process.cwd(), name)}`)

        for (const eachNewExtraction of this.options.extract({ source, name })) {
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
            this.css.findAndInsert(eachExtraction)
        }

        const spent = Math.round((performance.now() - p1) * 1000)
        const validClasses = this.css.rules.map((rule) => rule.className)

        /* 印出 Master CSS 編譯時間 */
        console.log(`[Master CSS] process ${chalk.green(extractions.length)} extractions in ${chalk.green(spent)} µs [${chalk.green(this.css.rules.length)} rules in ${chalk.green(this.options.output)}]`)

        this.log('extractions', `  → ${chalk.green(extractions.length)} extractions: ${chalk.blue(extractions.join(' '))}`)
        this.log('validClasses', `  → ${chalk.green(validClasses.length)} total valid classes: ${chalk.blue(validClasses.join(' '))}`)
    }

    log(name, content) {
        if (this.options.debug === true || Array.isArray(this.options.debug) && this.options.debug.includes(name)) {
            console.log(content)
        }
    }
}