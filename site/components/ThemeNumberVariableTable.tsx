import InlineCode from '~/internal/components/InlineCode'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'

interface ThemeNumberVariableTableProps {
    namespace: string
    variablePrefix?: string
    descriptions?: Record<string, string>
    representation?: 'spacing'
}

const formatRem = (value: number) => `${Number(value.toFixed(4))}rem`
const formatPx = (value: number) => `${Number(value.toFixed(4))}px`

export default function ThemeNumberVariableTable(props: ThemeNumberVariableTableProps) {
    const { namespace, variablePrefix = namespace, descriptions, representation } = props
    const entries = getThemeNumericVariableEntries(namespace)
    const hasDescriptions = descriptions && entries.some(({ key }) => descriptions[key])
    const hasSpacingRepresentation = representation === 'spacing'
    const referenceUnit = entries.every(({ unit }) => unit === 'rem') ? 'px' : 'rem'

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Value</th>
                            <th>{referenceUnit.toUpperCase()}</th>
                            {hasSpacingRepresentation && <th>Representation</th>}
                            {hasDescriptions && <th>Description</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {
                            entries.map((entry, index) => (
                                <tr key={entry.key}>
                                    <th><InlineCode>{`--${variablePrefix}-${entry.key}`}</InlineCode></th>
                                    <td><InlineCode>{entry.value}</InlineCode></td>
                                    <td>{referenceUnit === 'px' ? formatPx(entry.px) : formatRem(entry.rem)}</td>
                                    {hasSpacingRepresentation && <td>{renderSpacingRepresentation(entry.value, index, entries.length)}</td>}
                                    {hasDescriptions && <td>{descriptions?.[entry.key]}</td>}
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}

function renderSpacingRepresentation(value: string, index: number, count: number) {
    return (
        <div className="inline-flex bg:stripe-pink outline:1px|solid|muted outline-offset:-1px v:middle w:fit" style={{ gap: value }}>
            {Array.from({ length: count + 2 - index }, (_, index) => <div key={index} className="inline-block size:1.5em bg:surface"></div>)}
        </div>
    )
}
