import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { expectClassPosition } from './test'

test.concurrent('styled template literal', () => {
    const target = 'class-b'
    const contents = ['const Button = styled.button`class-a ', target, '`']
    expectClassPosition(target, contents, 'tsx')
})

test.concurrent('styled template literal and new lines', () => {
    const target = 'class-b'
    const contents = [dedent`
        const Button = styled
            .button\`class-a `, target, '`']
    expectClassPosition(target, contents, 'tsx')
})

test.concurrent('styled invoked', () => {
    const target = 'class-b'
    const contents = ['const Button = styled.button("class-a ', target, '")']
    expectClassPosition(target, contents, 'tsx')
})
