import { selectFoundationTokens } from '@master/internal-site/css/foundation-data/tokens.ts'

export function tokenValuesMarkdown(namespace: string, keys: string[]) {
  return selectFoundationTokens(namespace, keys).map(token =>
    `- \`--${token.name}\`: ${token.values.map(value => `\`${value.value}\` (${value.path.join(' → ')})`).join('; ')}`
  ).join('\n')
}
