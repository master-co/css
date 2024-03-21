import MasterCSS from '../../../src'
import config from '../../config'

it('uses with $ function', () => {
    expect(new MasterCSS().create('font-weight:$(font-weight-thin)')?.text).toContain('font-weight:100')
    expect(new MasterCSS().create('font-weight:$(font-weight-thin,123)')?.text).toContain('font-weight:100')
    expect(new MasterCSS().create('font-weight:$(font-weight,font-weight-thin)')?.text).toContain('font-weight:var(--font-weight,100)')
    expect(new MasterCSS().create('background-color:$(black)')?.text).toContain('background-color:rgb(0 0 0)')
    expect(new MasterCSS().create('background-color:$(my-gray,$(black))')?.text).toContain('background-color:var(--my-gray,rgb(0 0 0))')
    expect(new MasterCSS().create('background-color:$(my-gray,black)')?.text).toContain('background-color:var(--my-gray,rgb(0 0 0))')
    expect(new MasterCSS().create('background-color:$(my-gray,$(my-gray-2,black))')?.text).toContain('background-color:var(--my-gray,var(--my-gray-2,rgb(0 0 0)))')
})

it('uses with var function', () => {
    expect(new MasterCSS().create('font-weight:var(--font-weight-thin)')?.text).toContain('font-weight:var(--font-weight-thin)')
    expect(new MasterCSS().create('font-weight:var(--font-weight-thin,123)')?.text).toContain('font-weight:var(--font-weight-thin,123)')
    expect(new MasterCSS().create('font-weight:var(--font-weight,font-weight-thin)')?.text).toContain('font-weight:var(--font-weight,100)')
    expect(new MasterCSS().create('background-color:var(--gray)')?.text).toContain('background-color:var(--gray)')
    expect(new MasterCSS().create('background-color:var(--my-gray,$(black))')?.declarations).toEqual({ 'background-color': 'var(--my-gray,rgb(0 0 0))' })
    expect(new MasterCSS().create('background-color:var(--my-gray,black)')?.text).toContain('background-color:var(--my-gray,rgb(0 0 0))')
    expect(new MasterCSS().create('background-color:var(--my-gray,$(my-gray-2,black))')?.text).toContain('background-color:var(--my-gray,var(--my-gray-2,rgb(0 0 0)))')
})

test('rule variables', () => {
    expect(new MasterCSS(config).create('font:sm')?.text).toBe('.font\\:sm{font-size:1rem}')
    expect(new MasterCSS(config).create('font-size:sm')?.text).toBe('.font-size\\:sm{font-size:1rem}')
    expect(new MasterCSS(config).create('ls:wide')?.text).toBe('.ls\\:wide{letter-spacing:0.025em}')
    expect(new MasterCSS(config).create('letter-spacing:wide')?.text).toBe('.letter-spacing\\:wide{letter-spacing:0.025em}')
    expect(new MasterCSS(config).create('shadow:x2')?.text).toBe('.shadow\\:x2{box-shadow:0rem 25px 50px -12px rgb(0 0 0 / 25%)}')
    expect(new MasterCSS(config).create('inset:sm|md|md|sm')?.text).toBe('.inset\\:sm\\|md\\|md\\|sm{inset:0.625rem 1.25rem 1.25rem 0.625rem}')
    expect(new MasterCSS(config).create('b:inputborder')?.text).toBe('.b\\:inputborder{border:0.125rem solid rgb(0 0 0)}')
    expect(new MasterCSS({
        variables: {
            content: { delimiter: '"123"' }
        }
    }).add('content:delimiter')?.text).toBe('.content\\:delimiter{content:"123"}')
    expect(new MasterCSS({
        variables: {
            content: { delimiter: '"|"' }
        }
    }).add('content:delimiter')?.text).toBe('.content\\:delimiter{content:"|"}')
    expect(new MasterCSS({
        variables: {
            border: {
                input: '1|solid|test-70'
            },
            test: { 70: '#000' }
        }
    }).create('b:input')?.text).toBe('.b\\:input{border:0.0625rem solid rgb(0 0 0)}')
    expect(new MasterCSS({
        variables: {
            zero: 0
        }
    }).create('box-shadow:0|0|$(zero)|2|black')?.text).toContain('box-shadow:0rem 0rem 0rem 0.125rem rgb(0 0 0)')
})