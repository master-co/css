export default {
    variables: [
        { namespace: 'color', key: 'primary', value: '#000000', mode: 'light' },
        { namespace: 'color', key: 'primary', value: '#ffffff', mode: 'dark' }
    ],
    modes: ['light', 'dark'],
    components: {
        btn: [
            { selector: '&', declarations: { display: 'inline-flex' } },
            { selector: '&', declarations: { 'background-color': 'var(--color-primary)' } }
        ]
    }
}
