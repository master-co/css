
const rule = require('../../lib/rules/class-order')
const RuleTester = require('eslint').RuleTester

new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
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
                        fg:white
                        f:24
                    ">
                        :)
                    </div>`,
            output: `
                    <div class="
                        bg:black
                        fg:white
                        f:24
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