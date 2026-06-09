import InlineCode from '~/internal/components/InlineCode'
import { getThemeNumberVariableEntries } from '~/site/utils/theme-variables'

interface ThemeNumberVariableTableProps {
    namespace: string
    variablePrefix?: string
    descriptions?: Record<string, string>
    representation?: 'spacing'
}

const formatRem = (value: number) => `${Number((value / 16).toFixed(4))}rem`

export default function ThemeNumberVariableTable(props: ThemeNumberVariableTableProps) {
    const { namespace, variablePrefix = namespace, descriptions, representation } = props
    const entries = getThemeNumberVariableEntries(namespace)
    const hasDescriptions = descriptions && entries.some(([key]) => descriptions[key])
    const hasSpacingRepresentation = representation === 'spacing'

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Value</th>
                            <th>(REM)</th>
                            {hasSpacingRepresentation && <th>Representation</th>}
                            {hasDescriptions && <th>Description</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {
                            entries.map(([key, value], index) => (
                                <tr key={key}>
                                    <th><InlineCode>{`${variablePrefix}-${key}`}</InlineCode></th>
                                    <td><InlineCode>{`${value}`}</InlineCode></td>
                                    <td>{formatRem(value)}</td>
                                    {hasSpacingRepresentation && <td>{renderSpacingRepresentation(value, index, entries.length)}</td>}
                                    {hasDescriptions && <td>{descriptions?.[key]}</td>}
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}

function renderSpacingRepresentation(value: number, index: number, count: number) {
    return (
        <div className="inline-flex bg:stripe-pink outline:1|lighter outline-offset:-1 v:middle w:fit" style={{ gap: formatRem(value) }}>
            {Array.from({ length: count + 2 - index }, (_, index) => <div key={index} className="inline-block size:1.5em bg:base"></div>)}
        </div>
    )
}
