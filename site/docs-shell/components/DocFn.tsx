import { DocDefaultValue, DocType } from './DocType'
import DocBadgeGroup from './DocBadgeGroup'
import InlineCode from './InlineCode'

export default function DocFn({ children }: any) {
  return (
    <div className="text-xs_code vertical-align:middle_td doc-table">
      <table>
        <thead>
          <tr>
            <th className="w:0 text-xs white-space:nowrap">Argument</th>
            <th className="text-xs">Type</th>
            <th className="w:100% text-xs">Default</th>
          </tr>
        </thead>
        <tbody>
          {children.map((arg: any) =>
            <tr key={arg.name}>
              <td>
                <InlineCode lang="ts">{arg.name}</InlineCode>
              </td>
              <td>
                {Array.isArray(arg.type)
                  ? <DocBadgeGroup>{arg.type.map((type: string,) => <DocType className="vertical-align:middle" type={type} key={type} />)}</DocBadgeGroup>
                  : <DocType className="vertical-align:middle" type={arg.type} />
                }
              </td>
              <td>
                {arg.defaultValue !== undefined
                  ? <DocDefaultValue className="vertical-align:middle">
                    <InlineCode lang="ts">{arg.defaultValue}</InlineCode>
                  </DocDefaultValue>
                  : <code className="text-disabled!">-</code>
                }
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
