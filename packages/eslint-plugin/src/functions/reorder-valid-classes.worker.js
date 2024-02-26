import { reorderForReadableClasses } from '@master/css'
import { runAsWorker } from 'synckit'
import getMasterCSS from './get-css.js'

export function runReorderValidClasses(classNames, config) {
    const currentCSS = getMasterCSS(config)
    return reorderForReadableClasses(classNames, { css: currentCSS })
        .filter((eachOrderedClassName) => classNames.includes(eachOrderedClassName))
}

runAsWorker(runReorderValidClasses)