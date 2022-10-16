const chalk = require('chalk')

module.exports = function generateCSSTextFromChanges(extractedClasses, css) {
    const config = css.config
    const loggable = (name) => {
        return config.debug === true || Array.isArray(config.debug) && config.debug.includes(name)
    }
    const p1 = performance.now()

    /* 根據類名尋找並插入規則 ( MasterCSS 本身帶有快取機制，重複的類名不會再編譯及產生 ) */
    const generatedClasses = extractedClasses.map((eachClass) => css.findAndInsert(eachClass))
    const spent = Math.round((performance.now() - p1) * 100000) / 100000
    const validClasses = css.rules.map((rule) => rule.className)

    if (config.debug) {
        loggable('extractedClasses') && console.log(`[Master CSS] ${chalk.green(extractedClasses.length)} extracted classes: ${chalk.blue(extractedClasses.join(' '))}`)
        loggable('validClasses') && console.log(`[Master CSS] ${chalk.green(validClasses.length)} valid classes: ${chalk.blue(validClasses.join(' '))}`)
    }

    /* 印出 Master CSS 編譯時間 */
    console.log(`[Master CSS] took ${chalk.green(spent)} ms to match ${chalk.green(extractedClasses.length)} strings and generate ${chalk.green(validClasses.length)} valid classes into ${chalk.green(config.output)}`)

    // 將所有規則 join 為一個 cssText
    return css.rules.map((eachRule) =>
        eachRule.natives
            .map((eachNativeRule) => eachNativeRule.text)
            .join('')
    ).join('')
}