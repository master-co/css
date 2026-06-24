import { expect, test } from 'vitest'
import {
    compileCSS,
    findStandaloneMasterDirectiveStatements,
    inspectCSS
} from '../src'

test.concurrent('recognizes @master entry as the only Master entry directive', () => {
    expect(findStandaloneMasterDirectiveStatements('@master entry;').map((statement) => statement.name)).toEqual(['entry'])
    expect(findStandaloneMasterDirectiveStatements('@master;')).toEqual([])
    expect(findStandaloneMasterDirectiveStatements('@master global;')).toEqual([])

    expect(inspectCSS('@master entry;')).toMatchObject({
        hasMasterEntryDirective: true,
        hasMasterCSSImport: false,
        hasMasterEntry: true
    })
    expect(inspectCSS('@master;').hasMasterEntry).toBe(false)
    expect(inspectCSS('@master global;').hasMasterEntry).toBe(false)
    expect(inspectCSS('@import "@master/css";').hasMasterEntry).toBe(true)
})

test.concurrent('strips @master entry before CSS transform', () => {
    const result = compileCSS('@master entry;\n.card { color: red; }')

    expect(result.css).not.toContain('@master entry')
    expect(result.nativeCSS).toContain('.card')
})
