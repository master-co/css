export default {
    utilities: [
        {
            name: 'a',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { color: 'oklch(0% 0 none)' } }
            ]
        },
        {
            name: 'b',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { 'text-decoration-line': 'underline' } },
                { selector: '&', declarations: { color: 'oklch(0% 0 none)' } }
            ] /* [!code highlight] */
        }
    ]
}
