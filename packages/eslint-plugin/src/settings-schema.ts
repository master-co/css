import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

const settingsSchema: JSONSchema4 = {
    type: 'object',
    properties: {
        classAttributes: {
            type: 'array',
            items: { type: 'string' },
        },
        classFunctions: {
            type: 'array',
            items: { type: 'string' },
        },
        ignoredKeys: {
            type: 'array',
            items: { type: 'string', minLength: 0 },
            uniqueItems: true,
        },
        manifest: {
            type: 'object',
        }
    },
}

export default settingsSchema
