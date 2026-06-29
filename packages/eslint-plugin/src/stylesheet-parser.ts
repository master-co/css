function getLocFromIndex(source: string, index: number) {
    const lines = source.slice(0, index).split(/\r\n|[\n\r]/)
    return {
        line: lines.length,
        column: lines[lines.length - 1].length
    }
}

export default {
    meta: {
        name: '@master/eslint-plugin-css/stylesheet-parser'
    },
    parseForESLint(source: string) {
        return {
            ast: {
                type: 'Program',
                body: [],
                comments: [],
                tokens: [],
                sourceType: 'module',
                range: [0, source.length],
                loc: {
                    start: { line: 1, column: 0 },
                    end: getLocFromIndex(source, source.length)
                }
            },
            visitorKeys: {
                Program: []
            }
        }
    }
}
