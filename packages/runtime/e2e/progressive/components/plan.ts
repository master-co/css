export default {
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'components',
            rules: [
                { selector: '&', declarations: { 'background-color': 'var(--color-foo)' } }
            ]
        }
    ],
    variables: [
        { namespace: 'color', key: 'foo', value: 'oklch(0% 0 none)' }
    ]
}
