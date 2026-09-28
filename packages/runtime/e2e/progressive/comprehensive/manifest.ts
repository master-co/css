import { UtilityType } from '@master/css-schema/utility-type'

export default {
  variables: [
    { key: 'primary', values: [{ path: ['@media (prefers-color-scheme:light)', ':root,:host'], value: '#000000' }] },
    { key: 'primary', values: [{ path: ['@media (prefers-color-scheme:dark)', ':root,:host'], value: '#ffffff' }] }
  ],
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
