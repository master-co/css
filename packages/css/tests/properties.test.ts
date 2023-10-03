import { testProp } from './css'

it('native properties', ()=> {
    testProp('y:1', 'y:1')
    testProp('x:1', 'x:1')
    testProp('cy:1', 'cy:1')
    testProp('cx:1', 'cx:1')
})