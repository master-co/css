import { Config, reorderForReadableClasses } from '@master/css'
import { runAsWorker } from 'synckit'
import getMasterCSS from '../get-mastercss'

export function runReorderValidClasses(classNames: string[], config: string | Config): string[] {
    const currentCSS = getMasterCSS(config)
    return reorderForReadableClasses(classNames, { css: currentCSS })
        .filter((eachOrderedClassName: string) => classNames.includes(eachOrderedClassName))
}

runAsWorker(runReorderValidClasses as any)