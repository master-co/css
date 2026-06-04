import { getThemeVariables } from '~/site/utils/theme-variables'

const easingUsage: Record<string, string> = {
    smooth: 'Balanced movement',
    soft: 'Gentle reveal',
    crisp: 'Quick, polished feedback',
    snap: 'Firm settling',
    accelerate: 'Leaving the screen',
    decelerate: 'Entering the screen',
    overshoot: 'Playful scale or position',
    rewind: 'Pulled-back exits',
    spring: 'Expressive emphasis'
}

export default () => {
    const easingEntries = getThemeVariables('easing')
        .map(({ key, value }) => [key, String(value)] as const)

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
                            easingEntries.map(([key, value]) => (
                                <tr key={key}>
                                    <th>{key}</th>
                                    <td><code>{value}</code></td>
                                    <td>{easingUsage[key]}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}
