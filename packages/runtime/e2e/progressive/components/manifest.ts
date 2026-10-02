import { UtilityType } from '@master/css-schema/utility-type'

export default {
  utilities: [
  {
    "kind": "static" as const, "name": "btn",
    "body": [
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
                "value": "var(--color-foo)"
              }
            ]
          }
        ]
      }
    ]
  }
],
  variables: [
    { namespace: 'color', key: 'foo', values: [{ path: [':root,:host'], value: 'oklch(0% 0 none)' }] }
  ]
}
