import { getThemeVariables } from '~/site/utils/theme-variables'

const durationUsage: Record<string, string> = {
    fastest: 'Pressed states, tiny feedback',
    faster: 'Quick exits and icon feedback',
    fast: 'Popovers, fades, short entrances',
    slow: 'Default UI movement',
    slower: 'Panels, drawers, larger reveals',
    slowest: 'Ambient or emphasized motion'
}

const getDurationNumber = (value: string) => Number(value.replace('ms', ''))

export default () => {
    const durationEntries = getThemeVariables('duration')
        .map(({ key, value }) => [key, String(value)] as const)
    const maxDuration = Math.max(...durationEntries.map(([, value]) => getDurationNumber(value)))

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Value</th>
                            <th>Use for</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            durationEntries.map(([key, value]) => {
                                const duration = getDurationNumber(value)
                                return (
                                    <tr key={key}>
                                        <th>{key}</th>
                                        <td>
                                            <div className="inline-flex items-center gap:sm w:full">
                                                <span>{value}</span>
                                                <div className="rel rounded overflow:hidden bg:line-subtle h:1x w:14x">
                                                    <div
                                                        className="abs rounded bg:primary/.45 h:full left:0 top:0"
                                                        style={{ width: `${duration / maxDuration * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td>{durationUsage[key]}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}
