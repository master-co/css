import InlineCode from '~/internal/components/InlineCode'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'

const sizingRoles = [
    {
        utility: 'w:*',
        role: 'Preferred inline size',
        description: 'Set the width of wrappers, columns, panels, media, and proportional regions.'
    },
    {
        utility: 'h:*',
        role: 'Preferred block size',
        description: 'Set the height of fixed regions, viewport sections, media slots, and controls.'
    },
    {
        utility: 'size:*',
        role: 'Equal axes',
        description: 'Set width and height together when the element is square by design.'
    },
    {
        utility: 'min-w:*, min-h:*, min:*',
        role: 'Lower bound',
        description: 'Prevent collapse, allow flex children to shrink, or set a minimum usable region.'
    },
    {
        utility: 'max-w:*, max-h:*, max:*',
        role: 'Upper bound',
        description: 'Cap growth for page wrappers, readable measures, panels, menus, and media.'
    },
    {
        utility: 'flex-basis:*',
        role: 'Flex starting size',
        description: 'Give flex items a shared starting width before free space is distributed.'
    },
    {
        utility: '@sm, @container(...)',
        role: 'Sizing boundary',
        description: 'Change sizing at the viewport or component container that owns the decision.'
    }
]

const containerDescriptions: Record<string, string> = {
    '3xs': 'Small floating layers, popovers, and compact component caps.',
    '2xs': 'Narrow cards, small panels, and compact side content.',
    xs: 'Small sidebars, forms, and dense content panels.',
    sm: 'Standard sidebars, drawers, and narrow modal content.',
    md: 'Medium panels, dialogs, and reusable component widths.',
    lg: 'Wide panels, editor side panes, and modal layouts.',
    xl: 'Large content columns and media regions.',
    '2xl': 'Large panels and section caps.',
    '3xl': 'Wide content areas and dashboard sections.',
    '4xl': 'Large page sections and split layouts.',
    '5xl': 'Common page wrapper cap.',
    '6xl': 'Wide page wrapper cap.',
    '7xl': 'Full application shell cap.',
    '8xl': 'Maximum wide-screen canvas cap.'
}

function renderInlineCodes(values: string[]) {
    return (
        <div className="flex flex-wrap gap:xs">
            {values.map((value) => (
                <InlineCode key={value} className="white-space:nowrap">{value}</InlineCode>
            ))}
        </div>
    )
}

export function SizingRoleTable() {
    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Class</th>
                            <th>Role</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sizingRoles.map(({ utility, role, description }) => (
                            <tr key={utility}>
                                <td>{renderInlineCodes(utility.split(', '))}</td>
                                <td>{role}</td>
                                <td>{description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    )
}

export function ContainerTokenTable() {
    const rows = getThemeNumericVariableEntries('container')

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Class</th>
                            <th>Role / Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ key, value }) => (
                            <tr key={key}>
                                <td className="white-space:nowrap">
                                    <InlineCode className="white-space:nowrap">{`--container-${key}`}</InlineCode>
                                </td>
                                <td>
                                    <InlineCode className="white-space:nowrap">{`w:${key}`}</InlineCode>
                                </td>
                                <td>
                                    <InlineCode className="white-space:nowrap">{value}</InlineCode> {containerDescriptions[key]} Also works contextually with <InlineCode className="white-space:nowrap">{`max-w:${key}`}</InlineCode>, <InlineCode className="white-space:nowrap">{`size:${key}`}</InlineCode>, and <InlineCode className="white-space:nowrap">{`flex-basis:${key}`}</InlineCode>.
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    )
}
