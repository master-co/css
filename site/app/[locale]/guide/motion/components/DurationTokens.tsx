import { variables } from '@master/css'

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
    const durationEntries = Object.entries(variables.duration)
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
                                            <div className="inline-flex align-items:center gap:sm w:full">
                                                <span>{value}</span>
                                                <div className="rel h:1x w:14x bg:line-lightest rounded overflow:hidden">
                                                    <div
                                                        className="abs top:0 left:0 h:full bg:primary/.45 rounded"
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
