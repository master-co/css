export default {
    variables: [
        { namespace: 'color', key: 'black', value: 'oklch(0% 0 none)' },
        { namespace: 'color', key: 'white', value: 'oklch(100% 0 none)' },
        { namespace: 'color', key: 'invert', value: '$color-black', mode: 'light' },
        { namespace: 'color', key: 'invert', value: '$color-white', mode: 'dark' }
    ],
    modes: ['light', 'dark'],
    modeTrigger: 'media',
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'components',
            rules: [
                { selector: '&:focus', declarations: { outline: '0.125rem var(--color-invert) solid' } },
                { selector: '&:focus', declarations: { 'outline-offset': '0.125rem' } }
            ] // [!code highlight]
        }
    ]
}
