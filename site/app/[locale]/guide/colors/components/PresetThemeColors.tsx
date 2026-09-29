import Aa from '~/site/docs-shell/components/Aa'
import Bg from '~/site/docs-shell/components/Bg'
import Demo from '~/site/docs-shell/components/Demo'
import DemoDark from '~/site/docs-shell/components/DemoDark'
import DemoLight from '~/site/docs-shell/components/DemoLight'
import InlineCode from '~/site/docs-shell/components/InlineCode'
import { getThemeVariables } from '~/site/utils/theme-variables'

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
  return getThemeVariables(namespace).filter(variable => namespace !== 'color' || /^[a-z]+$/.test(variable.key) && variable.value.startsWith('var(')).map((variable) => {
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
  (key) => [`bg-${key}`, `fg-${key}`],
  (key) => `bg-${key}`,
  'background'
)
const lineRows = getModeRows('color-line', (key) => [`b-${key}`], (key) => `outline-${key}`, 'line')
const baseHueRows = colorRows
const surfaceRows = getModeRows(
  'color-surface',
  (key) => key === 'base' ? ['bg-surface-base'] : [`bg-surface-${key}`],
  (key) => key === 'base' ? 'bg-surface-base' : `bg-surface-${key}`,
  'background'
)
const textRows = getModeRows('color-text', (key) => [`fg-text-${key}`], (key) => `fg-text-${key}`, 'text')
const textRoleKeys = new Set(['body', 'strong', 'muted', 'disabled', 'inverse', 'link', 'link-hover'])
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
  inset: 'Recessed regions and inset sections.',
  raised: 'Raised cards, controls, and stacked surfaces.',
  floating: 'Floating layers such as dialogs, popovers, and menus.',
  inverse: 'High-contrast inverse surfaces.'
}
const lineRoleDescriptions: Record<string, string> = {
  divider: 'Decorative dividers; not required control boundaries.',
  control: 'Required control boundaries on opaque preset surfaces.',
  subtle: 'Low-contrast hairlines and soft outlines.'
}
const textRoleDescriptions: Record<string, string> = {
  body: 'Default readable foreground text.',
  strong: 'Headings, labels, and emphasized foreground text.',
  muted: 'Secondary text on base, inset, or raised; use fg-text-body on floating.',
  disabled: 'Unavailable actions and disabled controls.',
  inverse: 'Text on inverse surfaces.',
  link: 'Default inline links.',
  'link-hover': 'Interactive link hover state.'
}
const rowDescriptionByGroup = {
  surfaces: (key) => surfaceDescriptions[key],
  lineRoles: (key) => lineRoleDescriptions[key],
  baseHue: (key) => `Fixed ${key} swatch; no text contrast guarantee.`,
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
        <div className="display:grid place-content:center height:3rem width:100% aspect-ratio:2/1 r-sm bg-surface-base shadow-lg"></div>
      </DemoLight>
      <DemoDark>
        <div className="display:grid place-content:center height:3rem width:100% aspect-ratio:2/1 r-sm bg-surface-base shadow-lg"></div>
      </DemoDark>
    </Demo>
  )
}

export function LineRolesDemo() {
  function renderPreview() {
    return (
      <div className="height:6rem width:6rem r-sm border-width:1.25rem border-style:solid b-line-divider"></div>
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
        <div className="display:grid place-content:center height:3rem width:100% aspect-ratio:2/1 r-sm bg-yellow"></div>
      </DemoLight>
      <DemoDark>
        <div className="display:grid place-content:center height:3rem width:100% aspect-ratio:2/1 r-sm bg-yellow"></div>
      </DemoDark>
    </Demo>
  )
}

export function TextHueDemo() {
  return (
    <Demo $py={0} $px={0}>
      <DemoLight>
        <div className="font-size-9xl font-weight-heavy fg-text-yellow">M</div>
      </DemoLight>
      <DemoDark>
        <div className="font-size-9xl font-weight-heavy fg-text-yellow">M</div>
      </DemoDark>
    </Demo>
  )
}

export function TextRolesDemo() {
  function renderPreview() {
    return (
      <div className="display:grid gap-xs width:100% max-w-3xs p-lg r-sm font-weight-semibold text-align:center bg-surface-raised fg-text-body shadow-lg">
        <div className="font-size-md font-weight-semibold fg-text-strong">Quarterly report</div>
        <p className="margin:0 fg-text-body">Revenue is on track for the current cycle.</p>
        <p className="margin:0 text-sm fg-text-muted">Updated 12 minutes ago</p>
        <button className="text-sm fg-text-disabled" disabled>Archived export unavailable</button>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a className="text-decoration:underline fg-text-link fg-text-link-hover:hover" href="#">Open report</a>
        <div className="width:fit-content margin-inline:auto mt-sm py-xs px-sm r-sm bg-surface-inverse fg-text-inverse">Private note</div>
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
                  <div className="display:flex flex-wrap:wrap gap-xs">
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
