import InlineCode from '~/site/docs-shell/components/InlineCode'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'
import { descriptions } from './scale-data'

const descriptionByKey: Record<string, string> = descriptions

export default function BreakpointVariables() {
  return <figure className="doc-table"><table>
    <thead><tr><th>Custom media</th><th>Minimum width</th><th>PX reference</th><th>Description</th></tr></thead>
    <tbody>{getThemeNumericVariableEntries('breakpoint').map(entry => <tr key={entry.key}>
      <th><InlineCode>{`--${entry.key}`}</InlineCode></th>
      <td><InlineCode>{entry.value}</InlineCode></td>
      <td>{entry.px}px</td>
      <td>{descriptionByKey[entry.key]}</td>
    </tr>)}</tbody>
  </table></figure>
}
