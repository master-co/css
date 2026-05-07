export default {
    components: {
        a: [
            { selector: '&', declarations: { color: 'oklch(0% 0 none)' } }
        ],
        b: [
            { selector: '&', declarations: { 'text-decoration-line': 'underline' } },
            { selector: '&', declarations: { color: 'oklch(0% 0 none)' } }
        ] /* [!code highlight] */
    }
}
