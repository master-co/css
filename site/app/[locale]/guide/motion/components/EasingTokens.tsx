import InlineCode from '~/internal/components/InlineCode'
import { getThemeVariables } from '~/site/utils/theme-variables'

const easingDescriptions: Record<string, string> = {
  smooth: 'Balanced movement for common UI transitions.',
  soft: 'Gentle reveals and quiet fades.',
  crisp: 'Quick feedback with a polished finish.',
  snap: 'Firm settling for compact controls.',
  accelerate: 'Exits or elements leaving the screen.',
  decelerate: 'Entrances or elements arriving on screen.',
  overshoot: 'Playful scale or position emphasis.',
  rewind: 'Pulled-back exits and reversals.',
  spring: 'Expressive emphasis; use sparingly.'
}

export function EasingTokenTable() {
  const rows = getThemeVariables('easing').map(({ key, value }) => {
    const name = String(key)
    return {
      key: name,
      token: `--easing-${name}`,
      utility: `animation-timing-function:${name}`,
      value: String(value),
      description: easingDescriptions[name]
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
