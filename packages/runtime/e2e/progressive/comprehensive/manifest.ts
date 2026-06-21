import UtilityType from 'shared/utility-type'

export default {
    variables: [
        { key: 'primary', value: '#000000', mode: 'light' },
        { key: 'primary', value: '#ffffff', mode: 'dark' }
    ],
    modes: ['light', 'dark'],
    utilities: [
        {
            name: 'btn',
            type: UtilityType.Semantic,
            layer: 'components',
            rules: [
                { selector: '&', declarations: { display: 'inline-flex' } },
                { selector: '&', declarations: { 'background-color': 'var(--primary)' } }
            ]
        }
    ]
}
