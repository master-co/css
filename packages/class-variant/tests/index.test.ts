import cv from '../src'

test('normal function', () => {
    const normalBtn = cv<{ intent?: string, size?: string, color: string, disabled?: boolean }>(
        'inline-flex rounded',
        ['top:30', 'left:40'],
        { 'r:5': true, 'r:6': false },
        {
            intent: {
                primary: 'bg:blue fg:white bg:blue-55:hover',
                secondary: 'bg:white fg:slate-30 bg:slate-90:hover',
            },
            size: {
                sm: 'text:14 p:5|15',
                md: 'text:16 p:10|25'
            },
            disabled: 'opacity:.5'
        },
        ['uppercase', { intent: 'primary', size: 'md' }],
        ({ intent, size }) => intent && size && 'font:semibold',
        ({ color }) => color && `color:${color}`
    )
     
    normalBtn.default = {
        intent: 'primary',
        size: 'sm'
    }

    expect(normalBtn()).toBe('inline-flex rounded top:30 left:40 r:5 font:semibold bg:blue fg:white bg:blue-55:hover text:14 p:5|15')
    expect(normalBtn({ intent: 'secondary', size: 'sm', color: 'red', disabled: true })).toBe('inline-flex rounded top:30 left:40 r:5 font:semibold color:red bg:white fg:slate-30 bg:slate-90:hover text:14 p:5|15 opacity:.5')
    expect(normalBtn({ intent: 'primary', size: 'md', color: 'red' })).toBe('inline-flex rounded top:30 left:40 r:5 font:semibold color:red uppercase bg:blue fg:white bg:blue-55:hover text:16 p:10|25')
})

test('literal function', () => {
    const literalBtn = cv<{ intent?: string, size?: string, color: string }>`
        inline-flex rounded
        ${['top:30', 'left:40']}
        ${{
            intent: {
                primary: 'bg:blue fg:white bg:blue-55:hover',
                secondary: 'bg:white fg:slate-30 bg:slate-90:hover',
            },
            size: {
                sm: 'text:14 p:5|15',
                md: 'text:16 p:10|25'
            }
        }}
        ${['uppercase', { intent: 'primary', size: 'md' }]}
        ${({ intent, size }) => intent && size && 'font:semibold'}
        color:${({ color }) => color}
    `
     
    literalBtn.default = {
        intent: 'primary',
        size: 'sm'
    }

    expect(literalBtn()).toBe('inline-flex rounded top:30 left:40 font:semibold color: bg:blue fg:white bg:blue-55:hover text:14 p:5|15')
    expect(literalBtn({ intent: 'secondary', size: 'sm', color: 'red' })).toBe('inline-flex rounded top:30 left:40 font:semibold color:red bg:white fg:slate-30 bg:slate-90:hover text:14 p:5|15')
    expect(literalBtn({ intent: 'primary', size: 'md', color: 'red' })).toBe('inline-flex rounded top:30 left:40 font:semibold color:red uppercase bg:blue fg:white bg:blue-55:hover text:16 p:10|25')
})