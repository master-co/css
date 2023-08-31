import { mount } from '@vue/test-utils'
import { VNode, h } from 'vue'
import { styled } from '../src/styled'

const MasterButton = styled.button<{ $color: string }>`
    inline-flex center-content
    ${['font:14', 'font:semibold']}
    ${{ test: true, test2: false, test3: true }}
    fg:white px:18 h:40 r:4
    bg:${({ $color }) => $color}
`
const CustomButton = styled<VNode, { $color: string }>(h('button'))`
    inline-flex center-content
    ${['font:14', 'font:semibold']}
    ${{ test: true, test2: false, test3: true }}
    fg:white px:18 h:40 r:4
    bg:${({ $color }) => $color}
`

test('Basic', () => {
    expect(mount(MasterButton, { props: { $color: 'red' }, slots: { default: 'Basic' } }).html())
        .toBe('<button class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:red">Basic</button>')
    expect(mount(CustomButton, { props: { $color: 'red' }, slots: { default: 'Basic' } }).html())
        .toBe('<button class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:red">Basic</button>')
})

test('Extend master component', () => {
    const ExtendButton = styled<typeof MasterButton, { $size: string }>(MasterButton)`bg:${({ $color }) => $color}-54:hover`
    expect(mount(ExtendButton, { props: { $color: 'blue' }, slots: { default: 'Extend' } }).html())
        .toBe('<button class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:blue bg:blue-54:hover">Extend</button>')

    const AButton = styled.a(MasterButton)``
    expect(mount(AButton, { props: { $color: 'purple' }, slots: { default: 'Tag Extend' } }).html())
        .toBe('<a class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:purple">Tag Extend</a>')
})

test('Extend custom component', () => {
    const ExtendButton = styled(CustomButton)`bg:${({ $color }) => $color}-54:hover`
    expect(mount(ExtendButton, { props: { $color: 'blue' }, slots: { default: 'Extend' } }).html())
        .toBe('<button class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:blue bg:blue-54:hover">Extend</button>')

    const AButton = styled.a(CustomButton)``
    expect(mount(AButton, { props: { $color: 'purple' }, slots: { default: 'Tag Extend' } }).html())
        .toBe('<a class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:purple">Tag Extend</a>')
})

test('Default props', () => {
    const ButtonWithDefaultProps = styled<VNode, { color: string }>(h('button', { color: 'red', onclick: () => console.log('Click') }, 'Button With Default Props'))`bg:${({ color }) => color}`
    expect(mount(ButtonWithDefaultProps).html())
        .toBe('<button color="red" class="bg:red">Button With Default Props</button>')
})

test('Prop composition', () => {
    const Button = styled<VNode, { intent: string, size: string }>(h('button', { intent: 'primary' }))`
        font:semibold rounded
        ${{
            intent: {
                primary: 'bg:blue-50 fg:white bg:blue-60:hover',
                secondary: 'bg:white fg:gray-80 b:gray-40 bg:gray-50:hover',
            },
            size: {
                sm: 'font:20 py:1 px:2',
                md: 'font:16 py:2 px:4'
            },
            disabled: 'opacity:.5'
        }}
        ${['uppercase', { intent: 'primary', size: 'md' }]}
        ${({ intent, size }) => ({ 'font:italic': !!intent && !!size })}
    `
    expect(mount(Button, { props: { size: 'md' } }).html())
        .toBe('<button intent="primary" size="md" class="font:italic font:semibold rounded uppercase bg:blue-50 fg:white bg:blue-60:hover font:16 py:2 px:4"></button>')
    expect(mount(Button, { props: { intent: 'secondary', disabled: true } }).html())
        .toBe('<button intent="secondary" disabled="" class="font:semibold rounded bg:white fg:gray-80 b:gray-40 bg:gray-50:hover opacity:.5"></button>')

    const ExtendButton = styled(Button)`
        ${{
            intent: {
                primary: 'bg:blue-70 fg:black bg:blue-80:hover'
            },
            size: {
                lg: 'font:32 py:5 px:7'
            },
            disabled: 'opacity:.6'
        }}
        ${['uppercase', { intent: 'primary', size: 'md' }]}
    `
    expect(mount(ExtendButton, { props: { size: 'md' } }).html())
        .toBe('<button intent="primary" size="md" class="font:italic font:semibold rounded uppercase bg:blue-70 fg:black bg:blue-80:hover font:16 py:2 px:4"></button>')
    expect(mount(ExtendButton, { props: { intent: 'secondary' } }).html())
        .toBe('<button intent="secondary" class="font:semibold rounded bg:white fg:gray-80 b:gray-40 bg:gray-50:hover"></button>')
    expect(mount(ExtendButton, { props: { intent: 'secondary', size: 'lg', disabled: true } }).html())
        .toBe('<button intent="secondary" size="lg" disabled="" class="font:italic font:semibold rounded bg:white fg:gray-80 b:gray-40 bg:gray-50:hover font:32 py:5 px:7 opacity:.6"></button>')
})

test('Alternative syntax', () => {
    const Div = styled<{ $intent: string, $size: string }>(
        'font:semibold rounded',
        {
            $intent: {
                primary: 'bg:blue-50 fg:white bg:blue-60:hover',
                secondary: 'bg:white fg:gray-80 b:gray-40 bg:gray-50:hover',
            },
            $size: {
                sm: 'font:20 py:1 px:2',
                md: 'font:16 py:2 px:4'
            }
        },
        ['uppercase', { $intent: 'primary', $size: 'md' }],
        ({ $intent, $size }) => $intent && $size && 'font:italic'
    )
    expect(mount(Div, { props: { $intent: 'primary', $size: 'md' } }).html())
        .toBe('<div class="font:semibold rounded font:italic uppercase bg:blue-50 fg:white bg:blue-60:hover font:16 py:2 px:4"></div>')

    const Button = styled.button<{ $intent: string, $size: string }>(
        'font:semibold rounded',
        {
            $intent: {
                '': 'bg:purple-50 fg:black bg:purple-60:hover',
                primary: 'bg:blue-50 fg:white bg:blue-60:hover',
                secondary: 'bg:white fg:gray-80 b:gray-40 bg:gray-50:hover',
            },
            $size: {
                sm: 'font:20 py:1 px:2',
                md: 'font:16 py:2 px:4'
            }
        },
        {
            HIHI: false
        },
        ({ disabled }) => ([
            'b:2|solid|red',
            {
                $intent: disabled ? 'secondary' : 'third',
                $size: 'lg'
            }]
        ),
        ['uppercase', { $intent: 'primary', $size: 'md', disabled: false }],
        ({ $intent, $size }) => $intent && $size && 'font:italic'
    )
    expect(mount(Button, { props: { $size: 'md' } }).html())
        .toBe('<button class="font:semibold rounded bg:purple-50 fg:black bg:purple-60:hover font:16 py:2 px:4"></button>')
    expect(mount(Button, { props: { $intent: 'primary', $size: 'md' } }).html())
        .toBe('<button class="font:semibold rounded font:italic uppercase bg:blue-50 fg:white bg:blue-60:hover font:16 py:2 px:4"></button>')
    expect(mount(Button, { props: { $intent: 'secondary', $size: 'lg', disabled: true } }).html())
        .toBe('<button disabled="" class="font:semibold rounded font:italic b:2|solid|red bg:white fg:gray-80 b:gray-40 bg:gray-50:hover"></button>')

    const ExtendButton = styled<typeof Button, { $intent: string, $size: string }>(Button)(
        {
            $intent: {
                primary: 'bg:blue-70 fg:black bg:blue-80:hover'
            },
            $size: {
                lg: 'font:32 py:5 px:7'
            }
        },
        ({ disabled }) => ([
            'b:2|solid|blue',
            {
                $intent: disabled ? 'secondary' : 'third',
                $size: 'lg',
            }
        ]),
        ['lowercase', { $intent: 'primary', $size: 'md', disabled: true }]
    )
    expect(mount(ExtendButton, { props: { $intent: 'primary', $size: 'md', disabled: true } }).html())
        .toBe('<button disabled="" class="font:semibold rounded font:italic lowercase bg:blue-70 fg:black bg:blue-80:hover font:16 py:2 px:4"></button>')
    expect(mount(ExtendButton, { props: { $intent: 'third', $size: 'lg' } }).html())
        .toBe('<button class="font:semibold rounded font:italic b:2|solid|blue font:32 py:5 px:7"></button>')
})
