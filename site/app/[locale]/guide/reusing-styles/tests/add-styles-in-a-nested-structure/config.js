export default {
    utilities: [
        { name: 'card', type: -4, layer: 'components', rules: [{ selector: '&', declarations: { 'border-radius': '0.5rem' } }] },                 /* .card */ /* [!code highlight] */
        { name: 'card-header', type: -4, layer: 'components', rules: [{ selector: '&', declarations: { 'border-bottom': '0.0625rem solid oklch(55.1% 0.027 264.364)' } }] },   /* .card-header */ /* [!code highlight] */
        { name: 'card-content', type: -4, layer: 'components', rules: [{ selector: '&', declarations: { padding: '1.25rem' } }] },       /* .card-content */ /* [!code highlight] */
        { name: 'card-footer', type: -4, layer: 'components', rules: [{ selector: '&', declarations: { 'border-top': '0.0625rem solid oklch(55.1% 0.027 264.364)' } }] },   /* .card-footer */ /* [!code highlight] */
    ]
}
