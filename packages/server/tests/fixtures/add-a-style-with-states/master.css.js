export default {
    components: {
        btn: [
            { selector: '&:focus', declarations: { outline: '0.125rem var(--color-invert) solid' } },
            { selector: '&:focus', declarations: { 'outline-offset': '0.125rem' } }
        ] // [!code highlight]
    }
}
