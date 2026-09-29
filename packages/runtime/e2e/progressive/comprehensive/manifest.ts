import { UtilityType } from '@master/css-schema/utility-type'

export default {
  variables: [
    { key: 'primary', values: [{ path: ['@media (prefers-color-scheme:light)', ':root,:host'], value: '#000000' }] },
    { key: 'primary', values: [{ path: ['@media (prefers-color-scheme:dark)', ':root,:host'], value: '#ffffff' }] }
  ],
  mixins: [
  {
    "name": "--btn",
    "body": [
      {
        "type": "rule" as const,
        "selector": "&",
        "body": [
          {
            "type": "declaration" as const,
            "property": "display",
            "value": [
              {
                "type": "text" as const,
                "value": "inline-flex"
              }
            ]
          }
        ]
      },
      {
        "type": "rule" as const,
        "selector": "&",
        "body": [
          {
            "type": "declaration" as const,
            "property": "background-color",
            "value": [
              {
                "type": "text" as const,
                "value": "var(--primary)"
              }
            ]
          }
        ]
      }
    ]
  }
]
}
