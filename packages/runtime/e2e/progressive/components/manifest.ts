import UtilityType from '@master/css-schema/utility-type'

export default {
    utilities: [
        {
            name: 'btn',
            type: UtilityType.Semantic,
            layer: 'components',
            rules: [
                { selector: '&', declarations: { 'background-color': 'var(--color-foo)' } }
            ]
        }
    ],
    variables: [
        { namespace: 'color', key: 'foo', value: 'oklch(0% 0 none)' }
    ]
}
