import { runAsWorker } from 'synckit'
import getMasterCSS from './get-css.cjs'
import { validate } from '@master/css-validator'

export function runValidate(className, config) {
    const currentCSS = getMasterCSS(config)
    return validate(className, { css: currentCSS })
}

runAsWorker(runValidate)