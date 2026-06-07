import type { CSSProperties } from 'react'
import InlineCode from '~/internal/components/InlineCode'
import { getThemeNumberVariableEntries } from '~/site/utils/theme-variables'

type Representation = 'spacing' | 'radius' | 'screen'

interface ThemeNumberVariableTableProps {
    namespace: string
    representation: Representation
    variablePrefix?: string
}

const formatRem = (value: number) => `${Number((value / 16).toFixed(4))}rem`

export default function ThemeNumberVariableTable(props: ThemeNumberVariableTableProps) {
    const { namespace, representation, variablePrefix = namespace } = props
    const entries = getThemeNumberVariableEntries(namespace)
    const largestValue = Math.max(...entries.map(([, value]) => value))

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Value</th>
                            <th>(REM)</th>
                            <th>Representation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            entries.map(([key, value], index) => (
                                <tr key={key}>
                                    <th><InlineCode>{`--${variablePrefix}-${key}`}</InlineCode></th>
                                    <td><InlineCode>{`${value}`}</InlineCode></td>
                                    <td>{formatRem(value)}</td>
                                    <td>{renderRepresentation(representation, value, index, entries.length, largestValue)}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}

function renderRepresentation(representation: Representation, value: number, index: number, count: number, largestValue: number) {
    if (representation === 'spacing') {
        return (
            <div className="inline-flex bg:stripe-pink outline:1|lighter outline-offset:-1 v:middle w:fit" style={{ gap: formatRem(value) }}>
                {Array.from({ length: count + 2 - index }, (_, index) => <div key={index} className="inline-block size:1.5em bg:base"></div>)}
            </div>
        )
    }

    if (representation === 'radius') {
        return (
            <div
                className="inline-block size:2.5em bg:primary/.12 outline:1|primary/.25 outline-offset:-1 v:middle"
                style={{ borderRadius: formatRem(value) }}
            ></div>
        )
    }

    const widthStyle: CSSProperties = {
        width: `${Math.max(12, value / largestValue * 100)}%`
    }

    return (
        <div className="w:full max-w:48x bg:stripe-pink outline:1|lighter outline-offset:-1 p:1">
            <div className="h:1.5em bg:primary/.28 outline:1|primary/.25 outline-offset:-1" style={widthStyle}></div>
        </div>
    )
}
