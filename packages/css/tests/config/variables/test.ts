import { testCSS } from '../../css'
import config from '../../config'

it('uses with $ function', () => {
    testCSS('font-weight:$(fontWeight-thin)', '.font-weight\\:\\$\\(fontWeight-thin\\){font-weight:100}')
})

test('rule variables', () => {
    testCSS('font:sm', '.font\\:sm{font-size:1rem}', config)
    testCSS('font-size:sm', '.font-size\\:sm{font-size:1rem}', config)
    testCSS('ls:wide', '.ls\\:wide{letter-spacing:0.025em}', config)
    testCSS('letter-spacing:wide', '.letter-spacing\\:wide{letter-spacing:0.025em}', config)
    testCSS('shadow:x2', '.shadow\\:x2{box-shadow:0rem 25px 50px -12px rgb(0 0 0 / 25%)}', config)
    testCSS('inset:sm|md|md|sm', '.inset\\:sm\\|md\\|md\\|sm{inset:0.625rem 1.25rem 1.25rem 0.625rem}', config)
    testCSS('b:inputborder', '.b\\:inputborder{border:0.125rem solid rgb(209 26 30)}', config)
    testCSS('content:delimiter', '.content\\:delimiter{content:"123"}', {
        variables: {
            content: { delimiter: '"123"' }
        }
    })
    testCSS('content:delimiter', '.content\\:delimiter{content:"|"}', {
        variables: {
            content: { delimiter: '"|"' }
        }
    })
    testCSS('b:input', '.b\\:input{border:0.0625rem solid rgb(0 0 0)}', {
        variables: {
            border: {
                input: '1|solid|test-70'
            },
            test: { 70: '#000' }
        }
    })
})