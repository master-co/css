import { Config, Rule } from '@master/css'
import { runAsWorker } from 'synckit'
import getMasterCSS from '../get-mastercss'
import { createValidRules } from '@master/css-validator'

export function runValidRules(classNames: string[], config: string | Config): Rule {
    const currentCSS = getMasterCSS(config)
    const ruleOfClass: any = {}
    classNames
        .forEach(eachClassName => {
            const validRule = createValidRules(eachClassName, { css: currentCSS })[0]
            if (validRule)
                ruleOfClass[eachClassName] = {
                    declarations: validRule?.declarations,
                    stateToken: validRule?.stateToken,
                }
        })
    return ruleOfClass
}

runAsWorker(runValidRules as any)