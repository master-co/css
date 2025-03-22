import log from 'shared/utils/log'

export default function registerClassCountDebugger() {
    const hook = globalThis.__MASTER_CSS_DEVTOOLS_HOOK__
    hook.on('runtime:mutated', ({ records, classCounts, cssRuntime }) => {
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
                log.error(`Class count mismatch for '${className}' (expected ${eachActualCount}) (received ${eachCount})`)
                errored = true
            }
        }

        cssRuntime.classCounts.forEach((eachCount, className) => {
            if (!Object.prototype.hasOwnProperty.call(actualClassCounts, className)) {
                log.error(`Class count mismatch for '${className}' (expected ${0}) (received ${eachCount})`)
                errored = true
            }
        })

        if (errored) {
            log.debug('Records:', records)
            log.debug('Counts:', classCounts)
        }
    })
}