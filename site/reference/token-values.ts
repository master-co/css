import { selectFoundationTokens } from '../common/foundation-data/tokens'

export function tokenValuesMarkdown(namespace: string, keys: string[]) {
  return selectFoundationTokens(namespace, keys).map(token =>
    `- \`--${token.name}\`: ${token.values.map(value => `\`${value.value}\` (${value.path.join(' → ')})`).join('; ')}`
  ).join('\n')
}
