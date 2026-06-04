export default {
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'components',
            rules: [
                { selector: '&', declarations: { display: 'inline-flex' } },
                { selector: '&', declarations: { height: '2.5rem' } }
            ] // [!code highlight]
        }
    ]
}
