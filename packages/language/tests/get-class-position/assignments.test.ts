import { test, it, expect, describe } from 'vitest'
import { expectClassPosition } from './test'

test.concurrent('clsx', () => {
    const target = 'class-b'
    const contents = ['const classes = clsx("class-a ', target, '")']
    expectClassPosition(target, contents, 'js')
})

test.concurrent('styled', () => {
    const target = 'class-b'
    const contents = ['const Button = styled("class-a ', target, '")']
    expectClassPosition(target, contents, 'tsx')
})

test.concurrent('escaped single quotes', () => {
    const target = `content:\\'\\'`
    const contents = [`export default () => <div className={'block `, target, `'}></div>`]
    expectClassPosition(target, contents, 'tsx')
})