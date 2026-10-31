import { DocDefaultValue, DocType } from './DocType'
import DocBadgeGroup from './DocBadgeGroup'
import InlineCode from './InlineCode'

export default function DocFn({ children }: any) {
  return (
    <div className="text-xs_code vertical-middle_td doc-table">
      <table>
        <thead>
          <tr>
            <th className="w(0) text-xs whitespace-nowrap">Argument</th>
            <th className="text-xs">Type</th>
            <th className="w-full text-xs">Default</th>
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
                  ? <DocBadgeGroup>{arg.type.map((type: string,) => <DocType className="vertical-middle" type={type} key={type} />)}</DocBadgeGroup>
                  : <DocType className="vertical-middle" type={arg.type} />
                }
              </td>
              <td>
                {arg.defaultValue !== undefined
                  ? <DocDefaultValue className="vertical-middle">
                    <InlineCode lang="ts">{arg.defaultValue}</InlineCode>
                  </DocDefaultValue>
                  : <code className="fg-text-muted!">-</code>
                }
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
