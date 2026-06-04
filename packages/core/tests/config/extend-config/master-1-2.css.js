const config = {
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'components',
            rules: [
                { selector: '&', declarations: { 'font-size': '1.25rem' } },
                { selector: '&', declarations: { height: '4.6875rem' } },
                { selector: '&', declarations: { 'text-align': 'center' } }
            ]
        },
        {
            name: 'btn3',
            type: -4,
            layer: 'components',
            rules: [
                { selector: '&', declarations: { 'font-size': '12.5rem' } }
            ]
        },
    ]
}

module.exports = {
    config
}
