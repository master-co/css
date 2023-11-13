import { Config } from '@master/css'
import { runAsWorker } from 'synckit'
import getMasterCSS from '../get-mastercss'
import { validate } from '@master/css-validator'

export function runValidate(className: string, config: string | Config): { isMasterCSS: boolean; errors: SyntaxError[] } {
    const currentCSS = getMasterCSS(config)
    return validate(className, { css: currentCSS }) as any
}

runAsWorker(runValidate as any)