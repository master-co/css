import { getThemeVariables } from '~/site/utils/theme-variables'
import InlineCode from '~/internal/components/InlineCode'

const shadowApplications: Record<string, string> = {
    xs: 'Subtle separation, small controls',
    sm: 'Card, raised button, compact panel',
    md: 'Floating toolbar, hover lift, command menu',
    lg: 'Dropdown, popover, toast',
    xl: 'Dialog, drawer, elevated panel',
    '2xl': 'Modal, blocking overlay, spotlight surface'
}

export default () => {
    const shadowEntries = getThemeVariables('shadow')
        .map(({ key, value }) => [key, String(value)] as const)

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Value</th>
                            <th>Application</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            shadowEntries.map(([key, value]) => (
                                <tr key={key}>
                                    <td><InlineCode className="white-space:nowrap">{`shadow-${key}`}</InlineCode></td>
                                    <td><InlineCode>{value}</InlineCode></td>
                                    <td>{shadowApplications[key]}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}
