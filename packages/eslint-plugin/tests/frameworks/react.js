'use strict'

const rule = require('../../lib/rules/class-order')
const RuleTester = require('eslint').RuleTester
const ruleTester = new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    }
})

ruleTester.run('class order', rule, {
    valid: [
        { code: '<h1 className={"bg:black fg:white f:24 m:8 p:8"}>Welcome {name}</h1>' }
    ],
    invalid: [
        {
            code: `
                    export interface FakePropsInterface {
                        readonly name?: string;
                    }
                    function Fake({
                        name = 'yolo'
                    }: FakeProps) {
                        return (
                        <>
                            <h1 className={"m:8 bg:black p:8 fg:white f:24"}>Welcome {name}</h1>
                            <p>Bye {name}</p>
                        </>
                        );
                    }
                    export default Fake;
                `,
            output: `
                    export interface FakePropsInterface {
                        readonly name?: string;
                    }
                    function Fake({
                        name = 'yolo'
                    }: FakeProps) {
                        return (
                        <>
                            <h1 className={"bg:black fg:white f:24 m:8 p:8"}>Welcome {name}</h1>
                            <p>Bye {name}</p>
                        </>
                        );
                    }
                    export default Fake;
                `,
            parser: require.resolve('@typescript-eslint/parser'),
            errors: [{ messageId: 'invalidClassOrder' }],
        },
    ]
})