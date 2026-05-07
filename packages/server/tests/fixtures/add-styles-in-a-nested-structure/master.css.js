export default {
    components: {
        card: [{ selector: '&', declarations: { 'border-radius': '0.5rem' } }], /* [!code highlight] */
        'card-header': [{ selector: '&', declarations: { 'border-bottom': '0.0625rem solid oklch(0% 0 none)' } }], /* [!code highlight] */
        'card-content': [{ selector: '&', declarations: { padding: '1.25rem' } }], /* [!code highlight] */
        'card-footer': [{ selector: '&', declarations: { 'border-top': '0.0625rem solid oklch(0% 0 none)' } }], /* [!code highlight] */
    }
}
