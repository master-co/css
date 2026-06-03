export default {
    utilities: [
        {
            name: 'a',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { color: 'oklch(87.1% 0.15 154.449)' } }
            ]
        },
        {
            name: 'b',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { 'text-decoration-line': 'underline' } },
                { selector: '&', declarations: { color: 'oklch(87.1% 0.15 154.449)' } }
            ] /* [!code highlight] */
        }
    ]
}
