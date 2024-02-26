import { runAsWorker } from 'synckit'
import getMasterCSS from './get-css.cjs'
import { generateValidRules } from '@master/css-validator'

export function runValidRules(classNames, config) {
    const currentCSS = getMasterCSS(config)
    const ruleOfClass = {}
    classNames
        .forEach(eachClassName => {
            const validRule = generateValidRules(eachClassName, { css: currentCSS })[0]
            if (validRule)
                ruleOfClass[eachClassName] = {
                    declarations: validRule?.declarations,
                    stateToken: validRule?.stateToken,
                }
        })
    return ruleOfClass
}

runAsWorker(runValidRules)