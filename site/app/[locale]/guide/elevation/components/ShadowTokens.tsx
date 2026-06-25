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
                            <th>Class</th>
                            <th>Variable</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ key, token, utility, role, description }) => (
                            <tr key={key}>
                                <td>
                                    <InlineCode className="white-space:nowrap">{utility}</InlineCode>
                                </td>
                                <td>
                                    <InlineCode className="white-space:nowrap">{token}</InlineCode>
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
                <div className="grid-cols:1 gap:lg w:full grid-cols:2@container(2xs) grid-cols:3@container(md)">
                    {getShadowRows().map(({ key, utility, role, description }) => (
                        <div className={`surface:raised r:lg p:md ${utility}`} key={key}>
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
        <div className="grid gap:xl w:full max-w:3xs p:lg r:lg text:body">
            <div className="p:md r:lg surface:base">
                <div className="font:medium text:strong">Base surface</div>
                <p className="mx:0 mb:0 mt:xs text:sm text:muted">Flat content stays grounded on the canvas.</p>
            </div>
            <div className="p:md r:lg surface:raised shadow:sm">
                <div className="font:medium text:strong">Raised surface</div>
                <p className="mx:0 mb:0 mt:xs text:sm text:muted">Cards use a small shadow on a raised surface.</p>
            </div>
            <div className="justify-self:end p:md r:lg surface:overlay shadow:lg w:5/6">
                <div className="font:medium text:strong">Overlay surface</div>
                <p className="mx:0 mb:0 mt:xs text:sm text:muted">Popovers detach from the page without changing the markup by mode.</p>
            </div>
        </div>
    )
}

export function SurfaceElevationDemo() {
    return (
        <Demo $py={0} $px={0}>
            <DemoLight className="grid place-items:center p:lg light">
                <SurfaceStack />
            </DemoLight>
            <DemoDark className="grid place-items:center p:lg dark">
                <SurfaceStack />
            </DemoDark>
        </Demo>
    )
}
