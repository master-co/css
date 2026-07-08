import InlineCode from '~/internal/components/InlineCode'
import { getThemeVariables } from '~/site/utils/theme-variables'

const durationDescriptions: Record<string, string> = {
  fastest: 'Micro feedback such as pressed states and tiny affordances.',
  faster: 'Quick exits, icon feedback, and very short state changes.',
  fast: 'Popovers, fades, short entrances, and hover feedback.',
  normal: 'Default interaction transitions when no stronger rhythm is needed.',
  slow: 'Standard UI movement and visible state changes.',
  slower: 'Panels, drawers, and larger reveals.',
  slowest: 'Ambient or emphasized motion that should be used sparingly.'
}

export function DurationTokenTable() {
  const rows = getThemeVariables('duration').map(({ key, value }) => {
    const name = String(key)
    return {
      key: name,
      token: `--duration-${name}`,
      utility: `animation-duration:${name}`,
      value: String(value),
      description: durationDescriptions[name]
    }
  })

  return (
    <figure>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Class</th>
              <th>Role / Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, token, utility, value, description }) => (
              <tr key={key}>
                <td className="white-space:nowrap">
                  <InlineCode className="white-space:nowrap">{token}</InlineCode>
                </td>
                <td>
                  <InlineCode className="white-space:nowrap">{utility}</InlineCode>
                </td>
                <td>
                  <InlineCode className="white-space:nowrap">{value}</InlineCode> {description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
