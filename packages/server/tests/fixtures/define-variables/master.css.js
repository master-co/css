export default {
    variables: [
        { key: 'full', value: '100%' },                                  // [!code highlight]
        { namespace: 'spacing', key: 'md', value: 20 },                  // [!code highlight]
        { namespace: 'color', key: 'black', value: '#000' },             /*  <─┐ */                      // [!code highlight]
        { namespace: 'color', key: 'primary', value: '$color-black' }    /*  ──┘  linked to black */     // [!code highlight]
    ]
}
