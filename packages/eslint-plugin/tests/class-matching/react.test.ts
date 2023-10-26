import rule from '../../src/rules/class-validation'
import { RuleTester } from 'eslint'

new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        }
    },
    parser: require.resolve('@typescript-eslint/parser')
}).run('class matching react', rule, {
    valid: [
        { code: '<h1 className={"bg:black"}>Welcome {name}</h1>' }
    ],
    invalid: [
        { code: '<h1 className={"bg:error"}>Welcome {name}</h1>', errors: [{ messageId: 'invalidClass' }] },
        {
            code: `
                import React from 'react'
                import { styled } from '@master/css.react'

                const H1 = styled.h1\`text-align:cente\`

                export default () => (
                    <H1>Hello World</H1>
                )
            `,
            errors: [{ messageId: 'invalidClass' }],
        },
        {
            code: `
                import React from 'react'
                import { styled } from '@master/css.react'

                const H1 = styled.h1('text-align:cente')

                export default () => (
                    <H1>Hello World</H1>
                )
            `,
            errors: [{ messageId: 'invalidClass' }],
        },
    ]
})