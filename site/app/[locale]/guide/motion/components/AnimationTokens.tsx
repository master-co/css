import InlineCode from '~/internal/components/InlineCode'
import { getThemeVariables } from '~/site/utils/theme-variables'

const animationDescriptions: Record<string, string> = {
  fade: 'Opacity reveal or exit when layout should stay steady.',
  flash: 'Temporary attention signal; avoid for persistent states.',
  float: 'Ambient lift for decorative or lightweight emphasis.',
  heart: 'Positive feedback for likes, favorites, or celebratory moments.',
  jump: 'Playful upward emphasis for expressive interfaces.',
  ping: 'Beacon or live-status pulse around an anchor.',
  pulse: 'Breathing feedback for loading, live, or waiting states.',
  rotate: 'Continuous spinner or progress indicator.',
  shake: 'Error or invalid-input attention; keep it short.',
  zoom: 'Scale reveal for popovers, dialogs, and emphasized entrances.'
}

export function AnimationTokenTable() {
  const rows = getThemeVariables('animate').map(({ key, value }) => {
    const name = String(key)
    return {
      key: name,
      token: `--animate-${name}`,
      utility: `animate:${name}`,
      value: String(value),
      description: animationDescriptions[name]
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
