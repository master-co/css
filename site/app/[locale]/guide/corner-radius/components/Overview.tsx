import InlineCode from '~/internal/components/InlineCode'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'

const radiusRoles: Record<string, string> = {
    xs: 'Compact inputs, small buttons, dense cells.',
    sm: 'Buttons, menus, toolbar controls.',
    md: 'Form fields, dense cards, reusable UI.',
    lg: 'Cards, popovers, media frames.',
    xl: 'Spacious cards, panels, dialogs.',
    '2xl': 'Modals, drawers, focused surfaces.',
    '3xl': 'Banners, illustrations, large media.',
    '4xl': 'Hero panels, oversized feature surfaces.'
}

const radiusShortcuts = [
    {
        key: 'rounded',
        token: 'rounded',
        utility: 'rounded',
        role: 'Tags, segmented controls, pill buttons.'
    },
    {
        key: 'round',
        token: 'round',
        utility: 'round',
        role: 'Avatars, icon buttons, indicators.'
    }
]

function getRadiusRows() {
    const tokenRows = getThemeNumericVariableEntries('radius').flatMap(({ key }) => {
        const role = radiusRoles[key]
        if (!role) return []

        return [{
            key,
            token: `--radius-${key}`,
            utility: `r:${key}`,
            role
        }]
    })

    return [...tokenRows, ...radiusShortcuts]
}

export function RadiusTokenTable() {
    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Class</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getRadiusRows().map(({ key, token, utility, role }) => (
                            <tr key={key}>
                                <td>
                                    <InlineCode className="white-space:nowrap">{token}</InlineCode>
                                </td>
                                <td>
                                    <InlineCode className="white-space:nowrap">{utility}</InlineCode>
                                </td>
                                <td>{role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    )
}
