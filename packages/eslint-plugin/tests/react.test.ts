import rule from '../src/rules/no-invalid-classes'
import { jsxTester } from './testers'

jsxTester.run('class matching react', rule, {
  valid: [
    { code: '<h1 className={"bg:black"}>Welcome {name}</h1>' }
  ],
  invalid: [
    { code: '<h1 className={"text-decoration:bad()"}>Welcome {name}</h1>', errors: [{ messageId: 'invalidClass' }] },
    {
      code: `
        import React from 'react'
        import styled from '@master/styled.react'

        const H1 = styled.h1\`text-decoration:bad()\`

        export default () => (
          <H1>Hello World</H1>
        )
      `,
      errors: [{ messageId: 'invalidClass' }],
    },
    {
      code: `
        import React from 'react'
        import styled from '@master/styled.react'

        const H1 = styled.h1('text-decoration:bad()')

        export default () => (
          <H1>Hello World</H1>
        )
      `,
      errors: [{ messageId: 'invalidClass' }],
    },
  ]
})
