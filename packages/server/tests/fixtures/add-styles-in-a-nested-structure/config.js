export default {
    utilities: [
        { name: 'card', type: -4, layer: 'components', rules: [{ selector: '&', declarations: { 'border-radius': '0.5rem' } }] }, /* [!code highlight] */
        { name: 'card-header', type: -4, layer: 'components', rules: [{ selector: '&', declarations: { 'border-bottom': '0.0625rem solid oklch(0% 0 none)' } }] }, /* [!code highlight] */
        { name: 'card-content', type: -4, layer: 'components', rules: [{ selector: '&', declarations: { padding: '1.25rem' } }] }, /* [!code highlight] */
        { name: 'card-footer', type: -4, layer: 'components', rules: [{ selector: '&', declarations: { 'border-top': '0.0625rem solid oklch(0% 0 none)' } }] }, /* [!code highlight] */
    ]
}
