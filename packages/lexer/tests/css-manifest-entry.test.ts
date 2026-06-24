import { expect, test } from 'vitest'
import {
    createMasterCSSManifestEntryPattern,
    findCSSImportStatements,
    findMasterDirectiveStatements,
    hasMasterCSSManifestEntrypoint,
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

test.concurrent('matches only explicit Master CSS manifest entrypoints', () => {
    const pattern = createMasterCSSManifestEntryPattern()

    expect(pattern.test('@master entry;')).toBe(true)
    expect(pattern.test('@import "@master/css";')).toBe(true)
    expect(pattern.test('@master;')).toBe(false)
    expect(pattern.test('@master global;')).toBe(false)
})

test.concurrent('finds and removes Master entry directives', () => {
    const source = '@master entry;\n@source "./x.css";\n.a{}'

    expect(hasMasterCSSManifestEntrypoint(source)).toBe(true)
    expect(findMasterDirectiveStatements(source).map((statement) => statement.name)).toEqual(['entry'])
    expect(removeMasterDirectiveStatements(source)).toEqual({
        code: '\n@source "./x.css";\n.a{}',
        removed: true
    })
})

test.concurrent('ignores non-entry @master at-rules', () => {
    const source = '@master;\n@master global;\n@master shake;\n@master no-shake;\n.a{}'

    expect(hasMasterCSSManifestEntrypoint(source)).toBe(false)
    expect(findMasterDirectiveStatements(source)).toEqual([])
    expect(removeMasterDirectiveStatements(source)).toEqual({
        code: source,
        removed: false
    })
})
