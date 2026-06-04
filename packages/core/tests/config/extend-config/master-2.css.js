const config = {
    utilities: [
        {
            name: 'btn3',
            type: -4,
            layer: 'components',
            rules: [
                { selector: '&', declarations: { 'font-size': '0.9375rem' } },
                { selector: '&', declarations: { height: '5.625rem' } },
                { selector: '&', declarations: { 'text-align': 'center' } }
            ]
        },
    ]
}

module.exports = {
    config
}
