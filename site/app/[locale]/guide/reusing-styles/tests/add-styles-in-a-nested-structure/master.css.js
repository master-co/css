export default {
    components: {
        card: [{ selector: '&', declarations: { 'border-radius': '0.5rem' } }],                 /* .card */ /* [!code highlight] */
        'card-header': [{ selector: '&', declarations: { 'border-bottom': '0.0625rem solid oklch(55.1% 0.027 264.364)' } }],   /* .card-header */ /* [!code highlight] */
        'card-content': [{ selector: '&', declarations: { padding: '1.25rem' } }],       /* .card-content */ /* [!code highlight] */
        'card-footer': [{ selector: '&', declarations: { 'border-top': '0.0625rem solid oklch(55.1% 0.027 264.364)' } }],   /* .card-footer */ /* [!code highlight] */
    }
}
