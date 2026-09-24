import { presetBreakpointConditions } from '~/site/common/preset-css'
import InlineCode from '~/site/docs-shell/components/InlineCode'
import { getThemeNumericVariableEntries, type ThemeNumericVariableEntry } from '~/site/utils/theme-variables'
import generateManifestCondition from '~/site/utils/generate-manifest-condition'

const breakpointVariableEntries = getThemeNumericVariableEntries('breakpoint')
const formatValue = (entry: ThemeNumericVariableEntry) => entry.value

export default () => {
  return (
    <figure className="doc-table">
      <table>
        <thead>
          <tr>
            <th className="w:0">Variant</th>
            <th className="w:0">Value</th>
            <th>Generated query</th>
          </tr>
        </thead>
        <tbody>
          {
            breakpointVariableEntries.map((entry) => (
              <tr key={entry.key}>
                <th className="white-space:nowrap"><InlineCode>{`@${entry.key}`}</InlineCode></th>
                <td className="white-space:nowrap"><InlineCode>{formatValue(entry)}</InlineCode></td>
                <td><InlineCode lang="css">{generateManifestCondition(presetBreakpointConditions[entry.key])}</InlineCode></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </figure>
  )
}
