export default {
    variables: [
        { namespace: 'color', key: 'primary', value: '#ff0000' },
        { namespace: 'color', key: 'primary', value: '#000000', mode: 'light' } /* [!code highlight] */,
        { namespace: 'color', key: 'primary', value: '#ffffff', mode: 'dark' } /* [!code highlight] */
    ],
    modes: ['light', 'dark']
}
