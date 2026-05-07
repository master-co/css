import type { Config } from '@master/css'

export default {
    components: {
        btn: [
            { selector: '&', declarations: { display: 'inline-flex' } },
            { selector: '&', declarations: { 'align-items': 'center' } },
            { selector: '&', declarations: { 'justify-content': 'center' } },
            { selector: '&', declarations: { 'font-weight': '600' } },
            { selector: '&', declarations: { 'outline-offset': '-0.0625rem' } }
        ],
        'btn-xs': [
            { selector: '&', declarations: { 'border-radius': '0.25rem' } },
            { selector: '&', declarations: { 'padding-left': '0.5rem', 'padding-right': '0.5rem' } },
            { selector: '&', declarations: { 'font-size': '0.75rem' } },
            { selector: '&', declarations: { height: '1.5rem' } }
        ],
        'btn-sm': [
            { selector: '&', declarations: { 'border-radius': '0.375rem' } },
            { selector: '&', declarations: { 'padding-left': '0.75rem', 'padding-right': '0.75rem' } },
            { selector: '&', declarations: { 'font-size': '0.75rem' } },
            { selector: '&', declarations: { height: '2rem' } }
        ],
        'btn-md': [
            { selector: '&', declarations: { 'border-radius': '0.375rem' } },
            { selector: '&', declarations: { 'padding-left': '1rem', 'padding-right': '1rem' } },
            { selector: '&', declarations: { 'font-size': '0.875rem' } },
            { selector: '&', declarations: { height: '2.5rem' } }
        ],
        'btn-lg': [
            { selector: '&', declarations: { 'border-radius': '0.5rem' } },
            { selector: '&', declarations: { 'padding-left': '1.25rem', 'padding-right': '1.25rem' } },
            { selector: '&', declarations: { 'font-size': '1rem' } },
            { selector: '&', declarations: { height: '3rem' } }
        ],
        'btn-xl': [
            { selector: '&', declarations: { 'border-radius': '0.625rem' } },
            { selector: '&', declarations: { 'padding-left': '1.5rem', 'padding-right': '1.5rem' } },
            { selector: '&', declarations: { 'font-size': '1rem' } },
            { selector: '&', declarations: { height: '3.5rem' } }
        ]
    }
} as Config
