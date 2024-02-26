import { runAsWorker } from 'synckit'
import getMasterCSS from './get-css'
import { validate, SyntaxError } from '@master/css-validator'

export default function runValidate(className: string, config: string | object): {
    isMasterCSS: boolean;
    errors: SyntaxError[];
} {
    const currentCSS = getMasterCSS(config)
    return validate(className, { css: currentCSS })
}

runAsWorker(runValidate as any)