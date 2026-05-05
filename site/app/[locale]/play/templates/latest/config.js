/** @type {import('@master/css').Config} */
export default {
    variables: [
        { namespace: 'color.text', key: 'primary', value: '$color-yellow-50', mode: 'light' },
        { namespace: 'color.text', key: 'primary', value: '$color-amber-20', mode: 'dark' }
    ],
    modes: ['light', 'dark']
}
