import dedent from 'ts-dedent'

export function defineContent({ compiler, jit, ext }: {
    compiler?: boolean
    jit?: boolean
    ext?: string
} = {}) {
    const existJoin = (arr: any[], separator = ', ') => {
        return arr.filter((x) => x).join(separator)
    }
    const typed = ext === 'ts'
    const cjs = ext === 'js'
    const typeSyntax = ext !== 'ts'
    const $export = cjs ? '' : 'export '
    const $import = cjs ? 'const' : 'import'
    const $from = cjs ? ' = require(' : ' from '
    const $fromEnd = cjs ? ')' : ''
    return [
        (typed || jit) && `${$import} ${existJoin([jit && (cjs ? '{ MasterCSS }' : 'MasterCSS'), (typed ? '{ Config }' : '')])}${$from}'@master/css'${$fromEnd}`,
        typed && compiler && `${$import} { Options }${$from}'@master/css-compiler'${$fromEnd}`,
        (typed || jit || typed && compiler) && '',
        typeSyntax && `/** @type {import('@master/css').Config} */`,
        dedent`${$export}const config${typed ? ': Config' : ''} = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }`,
        compiler && '',
        compiler && typeSyntax && `/** @type {import('@master/css-compiler').Options} */`,
        compiler && dedent`${$export}const compilerOptions${typed ? ': Options' : ''} = {
            sources: [],
            classes: {
                fixed: [],
                ignored: []
            }
        }`,
        jit && `\n${$export}const css = new MasterCSS(config)`,
        !$export && `\nmodule.exports = { ${existJoin(['config', jit && 'css', compiler && 'compilerOptions'])} }`
    ]
        .filter((x) => typeof x === 'string')
        .join('\n')
        + '\n'
}