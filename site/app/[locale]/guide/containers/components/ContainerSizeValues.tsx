import InlineCode from '~/internal/components/InlineCode'
import { getThemeNumericVariableEntries, type ThemeNumericVariableEntry } from '~/site/utils/theme-variables'

const containerVariableEntries = getThemeNumericVariableEntries('container')
const formatLength = (value: number, unit: string) => `${Number(value.toFixed(4))}${unit}`
const formatValue = (entry: ThemeNumericVariableEntry) => `${formatLength(entry.px, 'px')} / ${formatLength(entry.rem, 'rem')}`

export default () => {
  return (
    <figure className="doc-table">
      <table>
        <thead>
          <tr>
            <th className="w:0">Value</th>
            <th className="w:0">Token</th>
            <th className="w:0">Size</th>
            <th>Example utility</th>
          </tr>
        </thead>
        <tbody>
          {
            containerVariableEntries.map((entry) => (
              <tr key={entry.key}>
                <th className="white-space:nowrap"><InlineCode>{entry.key}</InlineCode></th>
                <td className="white-space:nowrap"><InlineCode>{`container-${entry.key}`}</InlineCode></td>
                <td className="white-space:nowrap"><InlineCode>{formatValue(entry)}</InlineCode></td>
                <td><InlineCode>{`max-w:${entry.key}`}</InlineCode></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </figure>
  )
}
