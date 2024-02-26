import { runAsWorker } from 'synckit'
import getMasterCSS from './get-css'
import { generateValidRules } from '@master/css-validator'
import { Rule } from '@master/css'

export default function runValidRules(classNames: string[], config: string | object):
    Record<string, { declarations: Rule['declarations'], stateToken: Rule['stateToken'] }> {
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

runAsWorker(runValidRules as any)