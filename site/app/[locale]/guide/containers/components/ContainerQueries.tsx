import { presetContainerQueries } from '~/site/common/preset-css'
import InlineCode from '~/site/docs-shell/components/InlineCode'
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
            <th className="width:0">Variant</th>
            <th className="width:0">Value</th>
            <th>Generated query</th>
          </tr>
        </thead>
        <tbody>
          {
            containerVariableEntries.map((entry) => (
              <tr key={entry.key}>
                <th className="white-space:nowrap"><InlineCode>{`@container((width>=${entry.value}))`}</InlineCode></th>
                <td className="white-space:nowrap"><InlineCode>{formatValue(entry)}</InlineCode></td>
                <td><InlineCode lang="css">{presetContainerQueries[entry.key]}</InlineCode></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </figure>
  )
}
