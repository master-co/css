import { execSync } from 'child_process'
import dedent from 'dedent'

it('init', () => {
    const defintion = execSync('node ../../dist/bin/index.cjs init', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        /** @type {import('@master/css').Config} */
        const config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }

        module.exports = { config }\n
    `)
})

it('init --jit', () => {
    const defintion = execSync('node ../../dist/bin/index.cjs init --jit', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        const { MasterCSS } = require('@master/css')

        /** @type {import('@master/css').Config} */
        const config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }

        const css = new MasterCSS(config)

        module.exports = { config, css }\n
    `)
})

it('init --compiler', () => {
    const defintion = execSync('node ../../dist/bin/index.cjs init --compiler', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        /** @type {import('@master/css').Config} */
        const config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }

        /** @type {import('@master/css-compiler').Options} */
        const compilerOptions = {
            sources: [],
            classes: {
                fixed: [],
                ignored: []
            }
        }

        module.exports = { config, compilerOptions }\n
    `)
})