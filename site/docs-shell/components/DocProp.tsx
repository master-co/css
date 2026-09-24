import clsx from 'clsx'
import { useMemo } from 'react'
import DocBadge from './DocBadge'
import { DocDefaultValue, DocType } from './DocType'
import DocBadgeGroup from './DocBadgeGroup'
import InlineCode from './InlineCode'
import Translate from './Translate'

export default function DocProp(props: any) {
  const defaultValueSpecified = 'defaultValue' in props
  const defaultValue: any = useMemo(() => {
    const type = typeof props.defaultValue
    switch (type) {
      case 'object':
        return JSON.stringify(props.defaultValue)
      case 'undefined':
        return 'undefined'
      default:
        return props.defaultValue
    }
  }, [props.defaultValue])
  return (
    <div className='doc-table'>
      <table className="text:xs_code">
        <thead>
          <tr>
            <th className="w:0 text:xs white-space:nowrap"><Translate>Type</Translate></th>
            <td>
              <DocBadgeGroup>
                {props.types.map((type: string,) => <DocType type={type} key={type} />)}
              </DocBadgeGroup>
            </td>
          </tr>
        </thead>
        {defaultValueSpecified &&
          <tbody>
            <tr>
              <th className="w:0 text:xs white-space:nowrap"><Translate>Default</Translate></th>
              <th>
                <DocBadgeGroup>
                  <DocDefaultValue>
                    <InlineCode lang="tsx" className={clsx(['auto', 'constructed'].includes(defaultValue) && 'italic text:body', 'white-space:pre-wrap! break-word')} beautify>{defaultValue}</InlineCode>
                  </DocDefaultValue>
                  {props.readonly && <DocBadge size="sm"><Translate>( Read Only )</Translate></DocBadge>}
                </DocBadgeGroup>
              </th>
            </tr>
          </tbody>
        }
      </table>
    </div>
  )
}
