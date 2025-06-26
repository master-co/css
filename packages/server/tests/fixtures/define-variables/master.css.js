export default {
    variables: {
        full: '100%',                                                   // [!code highlight]
        spacing: {
            md: 20,                                                     // [!code highlight]
        },
        color: {
            black: '#000',              /*  <─┐ */                      // [!code highlight]
            primary: '$color-black',    /*  ──┘  linked to black */     // [!code highlight]
        }
    }
}