import { Fragment } from 'react'
import Aa from '~/internal/components/Aa'
import Bg from '~/internal/components/Bg'
import Demo from '~/internal/components/Demo'
import DemoDark from '~/internal/components/DemoDark'
import DemoLight from '~/internal/components/DemoLight'
import InlineCode from '~/internal/components/InlineCode'
import { getThemeModeVariables } from '~/site/utils/theme-variables'

type PresetThemeColorPreview = 'background' | 'text'
type PresetThemeColorGroup = 'canvas' | 'surfaces' | 'baseHue' | 'textHue'

interface PresetThemeColorRow {
    token: string
    classNames: string[]
    previewClassName: string
    previewType: PresetThemeColorPreview
}

function tokenName(namespace: string, key: string) {
    if (namespace === 'color') return `color-${key}`
    return `${namespace}-${key}`
}

function getModeRows(
    namespace: string,
    classNames: (key: string) => string[],
    previewClassName: (key: string) => string,
    previewType: PresetThemeColorPreview
): PresetThemeColorRow[] {
    return getThemeModeVariables(namespace, 'light').map((variable) => {
        const key = String(variable.key)
        const name = variable.name || tokenName(namespace, key)

        return {
            token: `--${name}`,
            classNames: classNames(key),
            previewClassName: previewClassName(key),
            previewType
        }
    })
}

const colorRows = getModeRows(
    'color',
    (key) => key === 'canvas' ? ['bg:canvas'] : [`bg:${key}`, `fg:${key}`],
    (key) => key === 'canvas' ? 'bg:canvas@light bg:canvas@dark' : `bg:${key}@light bg:${key}@dark`,
    'background'
)
const canvasRows = colorRows.filter(({ token }) => token === '--color-canvas')
const baseHueRows = colorRows.filter(({ token }) => token !== '--color-canvas')
const surfaceRows = getModeRows('color-surface', (key) => [`surface:${key}`], (key) => `surface:${key}@light surface:${key}@dark`, 'background')
const textRows = getModeRows('color-text', (key) => [`text:${key}`], (key) => `text:${key}@light text:${key}@dark`, 'text')
const rowsByGroup = {
    canvas: canvasRows,
    surfaces: surfaceRows,
    baseHue: baseHueRows,
    textHue: textRows
} satisfies Record<PresetThemeColorGroup, PresetThemeColorRow[]>

function PresetThemeColorPreviewCell({ previewClassName, previewType }: Pick<PresetThemeColorRow, 'previewClassName' | 'previewType'>) {
    return previewType === 'text'
        ? <Aa className={previewClassName} />
        : <Bg className={previewClassName} />
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

export default function PresetThemeColors({ group }: { group: PresetThemeColorGroup }) {
    const rows = rowsByGroup[group]

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Class</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ token, classNames, previewClassName, previewType }) => (
                            <tr key={token}>
                                <td><PresetThemeColorPreviewCell previewClassName={previewClassName} previewType={previewType} /><InlineCode className="white-space:nowrap">{token}</InlineCode></td>
                                <td>
                                    {classNames.map((className, index) => (
                                        <Fragment key={className}>
                                            {index > 0 && ' '}
                                            <InlineCode className="white-space:nowrap">{className}</InlineCode>
                                        </Fragment>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    )
}
