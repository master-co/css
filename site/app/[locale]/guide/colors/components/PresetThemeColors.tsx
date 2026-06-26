import Aa from '~/internal/components/Aa'
import Bg from '~/internal/components/Bg'
import Demo from '~/internal/components/Demo'
import DemoDark from '~/internal/components/DemoDark'
import DemoLight from '~/internal/components/DemoLight'
import InlineCode from '~/internal/components/InlineCode'
import { getThemeModeVariables } from '~/site/utils/theme-variables'

type PresetThemeColorPreview = 'background' | 'line' | 'text'
type PresetThemeColorGroup = 'surfaces' | 'lineRoles' | 'baseHue' | 'textRoles' | 'textHue'

interface PresetThemeColorRow {
    key: string
    token: string
    utilities: string[]
    previewClassName: string
    previewType: PresetThemeColorPreview
}

function tokenName(namespace: string, key: string) {
    if (namespace === 'color') return `color-${key}`
    return `${namespace}-${key}`
}

function getModeRows(
    namespace: string,
    utilities: (key: string) => string[],
    previewClassName: (key: string) => string,
    previewType: PresetThemeColorPreview
): PresetThemeColorRow[] {
    return getThemeModeVariables(namespace, 'light').map((variable) => {
        const key = String(variable.key)
        const name = variable.name || tokenName(namespace, key)

        return {
            key,
            token: `--${name}`,
            utilities: utilities(key),
            previewClassName: previewClassName(key),
            previewType
        }
    })
}

const colorRows = getModeRows(
    'color',
    (key) => [`bg:${key}`, `fg:${key}`],
    (key) => `bg:${key}@light bg:${key}@dark`,
    'background'
)
const lineRows = getModeRows('color-line', (key) => [`b:${key}`], (key) => `outline:${key}@light outline:${key}@dark`, 'line')
const baseHueRows = colorRows
const surfaceRows = getModeRows(
    'color-surface',
    (key) => key === 'base' ? ['surface:base'] : [`surface:${key}`],
    (key) => key === 'base' ? 'bg:surface-base@light bg:surface-base@dark' : `surface:${key}@light surface:${key}@dark`,
    'background'
)
const textRows = getModeRows('color-text', (key) => [`text:${key}`], (key) => `text:${key}@light text:${key}@dark`, 'text')
const textRoleKeys = new Set(['body', 'strong', 'muted', 'subtle', 'disabled', 'placeholder', 'inverse', 'link', 'link-hover'])
const textRoleRows = textRows.filter(({ key }) => textRoleKeys.has(key))
const textHueRows = textRows.filter(({ key }) => !textRoleKeys.has(key))
const rowsByGroup = {
    surfaces: surfaceRows,
    lineRoles: lineRows,
    baseHue: baseHueRows,
    textRoles: textRoleRows,
    textHue: textHueRows
} satisfies Record<PresetThemeColorGroup, PresetThemeColorRow[]>
const columnTitleByGroup = {
    surfaces: 'Role',
    lineRoles: 'Role',
    baseHue: 'Use for',
    textRoles: 'Role',
    textHue: 'Use for'
} satisfies Record<PresetThemeColorGroup, string>
const surfaceDescriptions: Record<string, string> = {
    base: 'Root page or app background.',
    muted: 'Subdued sections and low-emphasis blocks.',
    raised: 'Raised cards, controls, and stacked surfaces.',
    overlay: 'Floating layers such as dialogs, popovers, and menus.',
    inverse: 'High-contrast inverse surfaces.'
}
const lineRoleDescriptions: Record<string, string> = {
    base: 'Default borders, dividers, outlines, and strokes.',
    strong: 'Emphasized boundaries and selected states.',
    muted: 'Quiet separators in dense interfaces.',
    subtle: 'Low-contrast hairlines and soft outlines.'
}
const textRoleDescriptions: Record<string, string> = {
    body: 'Default readable foreground text.',
    strong: 'Headings, labels, and emphasized foreground text.',
    muted: 'Secondary copy, metadata, and quiet navigation.',
    subtle: 'Low-emphasis helper text and placeholder-adjacent content.',
    disabled: 'Unavailable actions and disabled controls.',
    placeholder: 'Input placeholders.',
    inverse: 'Text on inverse surfaces.',
    link: 'Default inline links.',
    'link-hover': 'Interactive link hover state.'
}
const rowDescriptionByGroup = {
    surfaces: (key) => surfaceDescriptions[key],
    lineRoles: (key) => lineRoleDescriptions[key],
    baseHue: (key) => `Mode-aware ${key} for backgrounds and foregrounds.`,
    textRoles: (key) => textRoleDescriptions[key],
    textHue: (key) => `Mode-aware ${key} foreground text.`
} satisfies Record<PresetThemeColorGroup, (key: string) => string>

function PresetThemeColorPreviewCell({ previewClassName, previewType }: Pick<PresetThemeColorRow, 'previewClassName' | 'previewType'>) {
    return previewType === 'text'
        ? <Aa className={previewClassName} />
        : <Bg className={previewClassName} />
}

export function SurfacesDemo() {
    return (
        <Demo $py={0} $px={0}>
            <DemoLight>
                <div className="grid place-content:center h:12x w:full aspect-ratio:2/1 r:sm surface:base shadow:lg"></div>
            </DemoLight>
            <DemoDark>
                <div className="grid place-content:center h:12x w:full aspect-ratio:2/1 r:sm surface:base shadow:lg"></div>
            </DemoDark>
        </Demo>
    )
}

export function LineRolesDemo() {
    function renderPreview() {
        return (
            <div className="size:24x b:5x|solid|base r:sm"></div>
        )
    }

    return (
        <Demo $py={0} $px={0}>
            <DemoLight>{renderPreview()}</DemoLight>
            <DemoDark>{renderPreview()}</DemoDark>
        </Demo>
    )
}

export function BaseHueDemo() {
    return (
        <Demo $py={0} $px={0}>
            <DemoLight>
                <div className="grid place-content:center h:12x w:full aspect-ratio:2/1 r:sm bg:yellow"></div>
            </DemoLight>
            <DemoDark>
                <div className="grid place-content:center h:12x w:full aspect-ratio:2/1 r:sm bg:yellow"></div>
            </DemoDark>
        </Demo>
    )
}

export function TextHueDemo() {
    return (
        <Demo $py={0} $px={0}>
            <DemoLight>
                <div className="font:9xl font:heavy text:yellow">M</div>
            </DemoLight>
            <DemoDark>
                <div className="font:9xl font:heavy text:yellow">M</div>
            </DemoDark>
        </Demo>
    )
}

export function TextRolesDemo() {
    function renderPreview() {
        return (
            <div className="grid gap:xs w:full max-w:3xs p:lg r:sm font:semibold text-center surface:raised text:body shadow:lg">
                <div className="font:md font:semibold text:strong">Quarterly report</div>
                <p className="m:0 text:body">Revenue is on track for the current cycle.</p>
                <p className="m:0 text:sm text:muted">Updated 12 minutes ago</p>
                <p className="m:0 text:sm text:disabled">Archived export unavailable</p>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a className="underline text:link text:link-hover:hover" href="#">Open report</a>
                <div className="w:fit mx:auto mt:sm px:sm py:xs r:sm surface:inverse text:inverse">Private note</div>
            </div>
        )
    }

    return (
        <Demo $py={0} $px={0}>
            <DemoLight>{renderPreview()}</DemoLight>
            <DemoDark>{renderPreview()}</DemoDark>
        </Demo>
    )
}

export default function PresetThemeColors({ group }: { group: PresetThemeColorGroup }) {
    const rows = rowsByGroup[group]
    const columnTitle = columnTitleByGroup[group]
    const rowDescription = rowDescriptionByGroup[group]

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Class</th>
                            <th>{columnTitle}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ key, token, utilities, previewClassName, previewType }) => (
                            <tr key={token}>
                                <td className="white-space:nowrap"><PresetThemeColorPreviewCell previewClassName={previewClassName} previewType={previewType} /><InlineCode className="white-space:nowrap">{token}</InlineCode></td>
                                <td>
                                    <div className="flex flex-wrap gap:xs">
                                        {utilities.map((utility) => (
                                            <InlineCode key={utility} className="white-space:nowrap">{utility}</InlineCode>
                                        ))}
                                    </div>
                                </td>
                                <td>{rowDescription(key)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    )
}
