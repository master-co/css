import { testProp } from '../../css'

const config = {
    variables: {
        spacing: { x1: 16 }
    }
}

test('spacing', () => {
    testProp('m:x1', 'margin:1rem', config)
    testProp('mt:x1', 'margin-top:1rem', config)
    testProp('scroll-mt:x1', 'scroll-margin-top:1rem', config)
    testProp('p:x1', 'padding:1rem', config)
    testProp('pt:x1', 'padding-top:1rem', config)
    testProp('cx:x1', 'cx:16', config)
    testProp('y:x1', 'y:16', config)
    testProp('outline-offset:x1', 'outline-offset:1rem', config)
})