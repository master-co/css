const config = {
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'main',
            rules: [
            { selector: '&', declarations: { 'font-size': '1.1875rem' } },
            { selector: '&', declarations: { height: '4.375rem' } },
            { selector: '&', declarations: { 'text-align': 'center' } }
            ]
        },
        {
            name: 'btn4',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { 'font-size': '12.5rem' } }
            ]
        }
    ]
}

module.exports = {
    config
}
