import { MasterCSS } from '../core'
import type { Config } from '../config'
import type { Rule } from '../rule'

export function renderRules(classes: string[], config?: Config): Rule[] {
    if (!classes?.length) return
    const css = new MasterCSS({ ...config, observe: false })
    for (const eachClassName of classes) {
        if (!(eachClassName in css.countBy)) {
            if (css.insert(eachClassName))
                css.countBy[eachClassName] = 1
        }
    }
    return css.rules
}