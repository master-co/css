import InlineCode from '~/internal/components/InlineCode'
import Translate from '~/internal/components/Translate'
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
                            <th><Translate>Token</Translate></th>
                            <th><Translate>Value</Translate></th>
                            <th>{referenceUnit.toUpperCase()}</th>
                            {hasSpacingRepresentation && <th><Translate>Representation</Translate></th>}
                            {hasDescriptions && <th><Translate>Description</Translate></th>}
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
                                    {hasDescriptions && <td><Translate>{descriptions?.[entry.key]}</Translate></td>}
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
        <div className="inline-flex w:fit outline:1px|solid|muted outline-offset:-1px bg:stripe-pink v:middle" style={{ gap: value }}>
            {Array.from({ length: count + 2 - index }, (_, index) => <div key={index} className="inline-block size:1.5em surface:raised"></div>)}
        </div>
    )
}
