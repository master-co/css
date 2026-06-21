import { test, it, expect, describe } from 'vitest'
import { expectClassPosition } from './test'

test.concurrent('single quote', () => {
    const target = ''
    const contents = ['export default () => <div className=\'', target, '\'></div>']
    expectClassPosition(target, contents, 'tsx')
})