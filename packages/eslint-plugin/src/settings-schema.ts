import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

const sourceMatcherSchema: JSONSchema4 = {
  type: 'array',
  items: { type: 'string', minLength: 1 },
  uniqueItems: true
}

export const masterCSSSettingsSchema: JSONSchema4 = {
  type: 'object',
  properties: {
    classAttributes: sourceMatcherSchema,
    classFunctions: sourceMatcherSchema,
    classDeclarations: sourceMatcherSchema,
    ignoredKeys: sourceMatcherSchema,
    manifest: {
      type: 'object',
    }
  },
  additionalProperties: false
}

export const noInvalidClassesOptionsSchema: JSONSchema4 = {
  type: 'object',
  properties: {
    disallowUnknownClass: { type: 'boolean' }
  },
  additionalProperties: false
}

export default masterCSSSettingsSchema
