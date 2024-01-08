import shuffle from 'shuffle-array'

it('checks that different input sources should have the same output', () => {
    const input = [
        'px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0',
        'mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0',
        'font:12',
        'font:semibold',
        'text:center',
        'fixed',
        'block',
        'round',
        'b:0'
    ]
    const output = [
        // semantics
        { className: 'block' },
        { className: 'fixed' },
        { className: 'round' },
        // native shorthand
        { className: 'b:0' },
        { className: 'm:0' },
        { className: 'p:0' },
        // custom shorthand
        { className: 'mx:0' },
        { className: 'my:0' },
        { className: 'px:0' },
        { className: 'py:0' },
        // native
        { className: 'font:12' },
        { className: 'font:semibold' },
        { className: 'mb:0' },
        { className: 'ml:0' },
        { className: 'mr:0' },
        { className: 'mt:0' },
        { className: 'pb:0' },
        { className: 'pl:0' },
        { className: 'pr:0' },
        { className: 'pt:0' },
        { className: 'text:center' },
    ]
    for (let i = 0; i < 10; i++) {
        expect(new MasterCSS().add(...shuffle([...input])).rules).toMatchObject(output)
    }
})

it('checks style declarations', () => {
    const input = [
        'font:12', 'font:32@md', 'font:24@sm', 'm:32', 'block', 'px:16', 'bg:blue-60:hover', 'round', 'mb:48'
    ]
    const output = [
        { className: 'block' },
        { className: 'round' },
        { className: 'm:32' },
        { className: 'px:16' },
        { className: 'font:12' },
        { className: 'mb:48' },
        { className: 'bg:blue-60:hover' },
        { className: 'font:24@sm' },
        { className: 'font:32@md' }
    ]
    for (let i = 0; i < 10; i++) {
        expect(new MasterCSS().add(...shuffle([...input])).rules).toMatchObject(output)
    }
})