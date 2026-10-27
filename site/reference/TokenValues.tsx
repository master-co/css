import { selectFoundationTokens } from '../common/foundation-data/tokens'

export function tokenValuesMarkdown(namespace: string, keys: string[]) {
  return selectFoundationTokens(namespace, keys).map(token =>
    `- \`--${token.name}\`: ${token.values.map(value => `\`${value.value}\` (${value.path.join(' → ')})`).join('; ')}`
  ).join('\n')
}

export default function TokenValues({ namespace, keys }: { namespace: string; keys: string[] }) {
  return <ul>{selectFoundationTokens(namespace, keys).map(token =>
    <li key={token.key}><code>--{token.name}</code>: {token.values.map((value, index) =>
      <span key={index}>{index ? '; ' : ''}<code>{value.value}</code> ({value.path.join(' → ')})</span>
    )}</li>
  )}</ul>
}
