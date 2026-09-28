import { UtilityType } from '@master/css-schema/utility-type'

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
    { namespace: 'color', key: 'foo', values: [{ path: [':root,:host'], value: 'oklch(0% 0 none)' }] }
  ]
}
