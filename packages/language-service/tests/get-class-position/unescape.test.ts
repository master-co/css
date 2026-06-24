import { test, it, expect, describe } from 'vitest'
import { expectClassPosition } from './test'

test.concurrent('single quote', () => {
    const target = ''
    const contents = ['export default () => <div className=\'', target, '\'></div>']
    expectClassPosition(target, contents, 'tsx')
})

test.concurrent('escaped backticks', () => {
    const target = 'content:\\`\\`'
    const contents = ['const className = ctl(`', target, '`)']
    expectClassPosition(target, contents, 'ts')
})
