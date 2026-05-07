export default {
    components: {
        a: [
            { selector: '&', declarations: { color: 'oklch(87.1% 0.15 154.449)' } }
        ],
        b: [
            { selector: '&', declarations: { 'text-decoration-line': 'underline' } },
            { selector: '&', declarations: { color: 'oklch(87.1% 0.15 154.449)' } }
        ] /* [!code highlight] */
    }
}
