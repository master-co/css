import config1 from './master-1-1.css'
import config2 from './master-1-2.css'

const config = {
    extends: [
        config1,
        config2,
    ],
    variables: [
        { key: 'fourth', value: '$first' },
        { key: 'first', value: 'oklch(0.18 0 0)' },
        { key: 'first', value: 'oklch(0,0,0)', mode: 'light' },
        { key: 'second', value: 'oklch(0 0 0/.5)', mode: 'light' },
        { key: 'first', value: '#222222', mode: 'dark' },
        { key: 'second', value: '#999999', mode: 'dark' },
        { key: 'third', value: '$color-white', mode: 'dark' },
        { key: 'third-2', value: '$color-white', mode: 'dark' },
    ],
    modes: ['light', 'dark'],
    components: {
        btn: [
            { selector: '&', declarations: { 'font-size': '0.875rem' } },
            { selector: '&', declarations: { height: '2.5rem' } },
            { selector: '&', declarations: { 'text-align': 'center' } }
        ],
        'blue-btn': [
            { selector: '&', declarations: { 'font-size': '0.875rem' } },
            { selector: '&', declarations: { height: '2.5rem' } },
            { selector: '&', declarations: { 'text-align': 'center' } },
            { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
        ]
    }
}

module.exports = {
    config
}
