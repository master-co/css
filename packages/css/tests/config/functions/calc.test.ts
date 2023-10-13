import { testCSS } from '../../css'

it('calc', () => {
    testCSS('line-height:calc(32-16)', '.line-height\\:calc\\(32-16\\){line-height:calc(32 - 16)}')
    testCSS('font-size:calc(32-16)', '.font-size\\:calc\\(32-16\\){font-size:calc(2rem - 1rem)}')
    testCSS('mt:calc(var(--g-y)*-.1)', '.mt\\:calc\\(var\\(--g-y\\)\\*-\\.1\\){margin-top:calc(var(--g-y) * -0.00625rem)}')
    testCSS('mt:calc(var(--g-y)*(-.1))', '.mt\\:calc\\(var\\(--g-y\\)\\*\\(-\\.1\\)\\){margin-top:calc(var(--g-y) * (-0.00625rem))}')
    testCSS('mt:calc(var(--g-y)--.1)', '.mt\\:calc\\(var\\(--g-y\\)--\\.1\\){margin-top:calc(var(--g-y) - -0.00625rem)}')
    testCSS('mr:calc(var(--g-x)/(-2px))', '.mr\\:calc\\(var\\(--g-x\\)\\/\\(-2px\\)\\){margin-right:calc(var(--g-x) / (-2px))}')
})

it('calc with variables', () => {
    testCSS('w:calc(-2+$(x1))', '.w\\:calc\\(-2\\+\\$\\(x1\\)\\){width:calc(-0.125rem + 3.75rem)}', {
        variables: { x1: 60 }
    })
    testCSS('w:calc(-2-$(1x))', '.w\\:calc\\(-2-\\$\\(1x\\)\\){width:calc(-0.125rem - 3.75rem)}', {
        variables: { '1x': 60 }
    })
    testCSS('w:calc(-$(1x)-2)', '.w\\:calc\\(-\\$\\(1x\\)-2\\){width:calc(-3.75rem - 0.125rem)}', {
        variables: { '1x': 60 }
    })
})