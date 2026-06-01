import { variables } from '@master/css'

export const screenVariableEntries = variables.flatMap(({ namespace, key, value }) =>
    namespace === 'screen' && typeof value === 'number'
        ? [[key, value] as const]
        : []
)

export const screenVariableValues = Object.fromEntries(screenVariableEntries) as Record<string, number>
