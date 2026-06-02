export default {
    variables: [
        { namespace: 'color', key: 'black', value: 'oklch(0% 0 none)' },
        { namespace: 'color', key: 'primary', value: '$color-black/.5' },     /*  <─┐ */ /* [!code highlight] */
        { namespace: 'color', key: 'secondary', value: '$color-primary/.5' }  /*  ──┘  linked to primary */ /* [!code highlight] */
    ]
}
