import { expect, test } from 'vitest'
import {
    findCSSImportStatements,
    findMasterDirectiveStatements,
    hasMasterCSSConfigEntrypoint,
    parseCSSImportSource,
    removeMasterDirectiveStatements
} from '../src'

test.concurrent('finds top-level CSS imports without splitting quoted semicolons', () => {
    const source = [
        '@import url("@master/css") layer(theme);',
        '.x { content: "@import url(\\"ignored\\");" }',
        '@import "./a;b.css";'
    ].join('\n')
    const imports = findCSSImportStatements(source)

    expect(imports.map((item) => item.statement)).toEqual([
        '@import url("@master/css") layer(theme);',
        '@import "./a;b.css";'
    ])
    expect(imports.map((item) => parseCSSImportSource(item.statement))).toEqual(['@master/css', './a;b.css'])
})

test.concurrent('finds and removes Master entry directives', () => {
    const source = '@master;\n@source "./x.css";\n.a{}'

    expect(hasMasterCSSConfigEntrypoint(source)).toBe(true)
    expect(findMasterDirectiveStatements(source).map((statement) => statement.name)).toEqual([''])
    expect(removeMasterDirectiveStatements(source)).toEqual({
        code: '\n@source "./x.css";\n.a{}',
        removed: true
    })
})
