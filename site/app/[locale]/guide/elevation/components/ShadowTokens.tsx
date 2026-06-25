import DemoDark from 'internal/components/DemoDark'
import DemoLight from 'internal/components/DemoLight'
import Demo from '~/internal/components/Demo'
import DemoLabel from '~/internal/components/DemoLabel'
import InlineCode from '~/internal/components/InlineCode'
import { getThemeModeVariables } from '~/site/utils/theme-variables'

const shadowRoles: Record<string, { utility: string, role: string, description: string }> = {
    xs: {
        utility: 'shadow:xs',
        role: 'Quiet separation',
        description: 'Small controls, table rows, and subtle raised states.'
    },
    sm: {
        utility: 'shadow:sm',
        role: 'Standard surface',
        description: 'Cards, reusable panels, and quiet product surfaces.'
    },
    md: {
        utility: 'shadow:md',
        role: 'Temporary lift',
        description: 'Hover lift, floating toolbars, and command surfaces.'
    },
    lg: {
        utility: 'shadow:lg',
        role: 'Detached overlay',
        description: 'Dropdowns, popovers, toasts, and menus.'
    },
    xl: {
        utility: 'shadow:xl',
        role: 'Workflow interruption',
        description: 'Drawers, dialogs, and focused panels.'
    },
    '2xl': {
        utility: 'shadow:2xl',
        role: 'Blocking layer',
        description: 'Modals and spotlight surfaces above a dimmed page.'
    }
}

function getShadowRows() {
    return getThemeModeVariables('shadow', 'light').flatMap(({ key }) => {
        const role = shadowRoles[key]
        if (!role) return []

        return [{
            key,
            token: `--shadow-${key}`,
            ...role
        }]
    })
}

export function ShadowTokenTable() {
    const rows = getShadowRows()

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Class</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ key, token, utility, role, description }) => (
                            <tr key={key}>
                                <td>
                                    <InlineCode className="white-space:nowrap">{token}</InlineCode>
                                </td>
                                <td>
                                    <InlineCode className="white-space:nowrap">{utility}</InlineCode>
                                </td>
                                <td>
                                    {role}, {description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    )
}

export function ShadowScaleDemo() {
    return (
        <Demo>
            <div className="container w:full">
                <div className="grid-cols:1 gap:xl w:full grid-cols:2@container(2xs)">
                    {getShadowRows().map(({ key, utility, role, description }) => (
                        <div className={`surface:raised r:lg p:lg ${utility}`} key={key}>
                            <DemoLabel>{utility}</DemoLabel>
                            <div className="font:medium text:strong">{role}</div>
                            <p className="mx:0 mb:0 mt:xs text:sm text:muted">{description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Demo>
    )
}

function SurfaceStack() {
    return (
        <div className="p:xl r:lg surface:raised shadow:lg">
            <div className="font:medium text:strong text:lg">Raised surface</div>
            <p className="mx:0 mb:0 mt:xs text:sm text:muted">Cards use a large shadow on a raised surface.</p>
        </div>
    )
}

export function SurfaceElevationDemo() {
    return (
        <Demo $py={0} $px={0}>
            <DemoLight>
                <SurfaceStack />
            </DemoLight>
            <DemoDark>
                <SurfaceStack />
            </DemoDark>
        </Demo>
    )
}
