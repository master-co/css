import { getThemeVariables } from '../utils/theme-variables'

export function tokenValuesMarkdown(namespace: string, keys: string[]) {
  const variables = getThemeVariables(namespace)
  return keys.map(key => {
    const variable = variables.find(variable => variable.key === key)
    if (!variable) throw new Error(`Unknown ${namespace} token: ${key}`)
    return `- \`--${variable.name}\`: \`${variable.value}\``
  }).join('\n')
}

export default function TokenValues({ namespace, keys }: { namespace: string; keys: string[] }) {
  const variables = getThemeVariables(namespace)
  return <ul>{keys.map(key => {
    const variable = variables.find(variable => variable.key === key)
    if (!variable) throw new Error(`Unknown ${namespace} token: ${key}`)
    return <li key={key}><code>--{variable.name}</code>: <code>{String(variable.value)}</code></li>
  })}</ul>
}
