import { execSync } from 'child_process'
import dedent from 'dedent'

it('init (with tsconfig.json)', () => {
    const defintion = execSync('node ../../dist/bin/index init', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        import { Config } from '@master/css'

        export const config: Config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }\n
    `)
})

it('init --jit (with tsconfig.json)', () => {
    const defintion = execSync('node ../../dist/bin/index init --jit', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        import MasterCSS, { Config } from '@master/css'

        export const config: Config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }

        export const css = new MasterCSS(config)\n
    `)
})

it('init --compiler (with tsconfig.json)', () => {
    const defintion = execSync('node ../../dist/bin/index init --compiler', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        import { Config } from '@master/css'
        import { Options } from '@master/css-compiler'

        export const config: Config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }

        export const compilerOptions: Options = {
            sources: [],
            classes: {
                fixed: [],
                ignored: []
            }
        }\n
    `)
})

it('init --jit --compiler (with tsconfig.json)', () => {
    const defintion = execSync('node ../../dist/bin/index init --jit --compiler', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        import MasterCSS, { Config } from '@master/css'
        import { Options } from '@master/css-compiler'

        export const config: Config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }

        export const compilerOptions: Options = {
            sources: [],
            classes: {
                fixed: [],
                ignored: []
            }
        }

        export const css = new MasterCSS(config)\n
    `)
})