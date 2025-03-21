import log from 'shared/utils/log'
import { installHook } from '@master/css-devtools-hook'

export default function startDebug() {
    log('debug mode is enabled by default in development.')
    const hook = installHook()
    hook.on('mutated', ({ records, classUsages, runtimeCSS }) => {
        const actualClassUsages: any = {}
        let errored = false
        const resolveClass = (className: string) => {
            if (Object.prototype.hasOwnProperty.call(actualClassUsages, className)) {
                actualClassUsages[className]++
            } else {
                actualClassUsages[className] = 1
            }
        }
        ((runtimeCSS.root.constructor.name === 'HTMLDocument') ? runtimeCSS.host : runtimeCSS.container)
            .querySelectorAll('[class]')
            .forEach((element) => {
                element.classList.forEach(resolveClass)
            })

        runtimeCSS.host.classList.forEach(resolveClass)

        for (const className in actualClassUsages) {
            const eachCount = runtimeCSS.classUsages.get(className)
            const eachActualUsage = actualClassUsages[className]
            if (eachCount !== eachActualUsage) {
                log.error(`Count mismatch for`, { class: className, expected: eachActualUsage, received: eachCount })
                errored = true
            }
        }

        runtimeCSS.classUsages.forEach((eachCount, className) => {
            if (!Object.prototype.hasOwnProperty.call(actualClassUsages, className)) {
                log.error(`Count mismatch for`, { class: className, expected: 0, received: eachCount })
                errored = true
            }
        })

        if (errored) {
            console.debug('Records:', records)
            console.debug('Counts:', classUsages)
        }
    })
}