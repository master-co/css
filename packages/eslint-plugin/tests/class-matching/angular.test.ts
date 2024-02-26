import { RuleTester } from '@typescript-eslint/rule-tester'
import rule from '../../src/rules/class-order'

new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        }
    }
}).run('class order', rule, {
    valid: [],
    invalid: [
        {
            code: `
                    <div class="
                        m:8
                        bg:black
                        p:8
                        f:24
                        fg:white
                    ">
                        :)
                    </div>`,
            output: `
                    <div class="
                        bg:black
                        f:24
                        fg:white
                        m:8
                        p:8
                    ">
                        :)
                    </div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            parser: require.resolve('@angular-eslint/template-parser'),
        }
    ],
})