export default {
    variables: [
        { namespace: 'breakpoint', key: 'sm', value: 834 }
    ],
    utilities: [
        { name: 'btn', type: -4, layer: 'components', rules: [
            { selector: '&', declarations: { display: 'inline-flex' } },
            { selector: '&', declarations: { 'font-weight': '600' } }
        ] }, // [!code highlight]
        { name: 'btn-sm', type: -4, layer: 'components', rules: [
            { selector: '&', declarations: { 'border-radius': '0.375rem' } },
            { selector: '&', declarations: { 'padding-left': '0.75rem', 'padding-right': '0.75rem' } },
            { selector: '&', declarations: { 'font-size': '0.75rem' } },
            { selector: '&', declarations: { height: '2rem' } }
        ] }, // [!code highlight]
        { name: 'btn-md', type: -4, layer: 'components', rules: [
            { selector: '&', declarations: { 'border-radius': '0.375rem' } },
            { selector: '&', declarations: { 'padding-left': '1rem', 'padding-right': '1rem' } },
            { selector: '&', declarations: { 'font-size': '0.875rem' } },
            { selector: '&', declarations: { height: '2.5rem' } }
        ] }, // [!code highlight]
    ]
}
