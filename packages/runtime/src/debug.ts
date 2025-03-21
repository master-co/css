import log from 'shared/utils/log'
import { installHook } from '@master/css-devtools-hook'

export default function startDebug() {
    log('debug mode is enabled by default in development.')
    const hook = installHook()
    hook.on('mutated', ({ records, classCounts, cssRuntime }) => {
        const actualClassCounts: any = {}
        let errored = false
        const resolveClass = (className: string) => {
            if (Object.prototype.hasOwnProperty.call(actualClassCounts, className)) {
                actualClassCounts[className]++
            } else {
                actualClassCounts[className] = 1
            }
        }
        ((cssRuntime.root.constructor.name === 'HTMLDocument') ? cssRuntime.host : cssRuntime.container)
            .querySelectorAll('[class]')
            .forEach((element) => {
                element.classList.forEach(resolveClass)
            })

        cssRuntime.host.classList.forEach(resolveClass)

        for (const className in actualClassCounts) {
            const eachCount = cssRuntime.classCounts.get(className)
            const eachActualCount = actualClassCounts[className]
            if (eachCount !== eachActualCount) {
                log.error(`Count mismatch for`, { class: className, expected: eachActualCount, received: eachCount })
                errored = true
            }
        }

        cssRuntime.classCounts.forEach((eachCount, className) => {
            if (!Object.prototype.hasOwnProperty.call(actualClassCounts, className)) {
                log.error(`Count mismatch for`, { class: className, expected: 0, received: eachCount })
                errored = true
            }
        })

        if (errored) {
            console.debug('Records:', records)
            console.debug('Counts:', classCounts)
        }
    })
}