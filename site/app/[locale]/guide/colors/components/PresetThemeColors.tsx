import type { ReactNode } from 'react'
import { Fragment } from 'react'
import Aa from '~/internal/components/Aa'
import Bg from '~/internal/components/Bg'
import Demo from '~/internal/components/Demo'
import DemoDark from '~/internal/components/DemoDark'
import DemoLight from '~/internal/components/DemoLight'
import InlineCode from '~/internal/components/InlineCode'
import { getThemeModeVariables } from '~/site/utils/theme-variables'

type PresetThemeColorPreview = 'background' | 'text'

interface PresetThemeColorRow {
    token: string
    classNames: string[]
    previewClassName: string
    previewType: PresetThemeColorPreview
}

interface PresetThemeColorTableProps {
    title: string
    description: string
    rows: PresetThemeColorRow[]
    children?: ReactNode
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

function PresetThemeColorPreviewCell({ previewClassName, previewType }: Pick<PresetThemeColorRow, 'previewClassName' | 'previewType'>) {
    return previewType === 'text'
        ? <Aa className={previewClassName} />
        : <Bg className={previewClassName} />
}

function BaseHueDemo() {
    return (
        <Demo $py={0} $px={0}>
            <DemoLight>
                <div className="grid place-content:center h:12x w:full aspect-ratio:2/1 r:sm font:heavy bg:yellow fg:yellow-95">Aa</div>
            </DemoLight>
            <DemoDark>
                <div className="grid place-content:center h:12x w:full aspect-ratio:2/1 r:sm font:heavy bg:yellow fg:yellow-95">Aa</div>
            </DemoDark>
        </Demo>
    )
}

function TextHueDemo() {
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

function PresetThemeColorTable({ title, description, rows, children }: PresetThemeColorTableProps) {
    return (
        <section>
            <h3>{title}</h3>
            <p>{description}</p>
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
            {children}
        </section>
    )
}

export default function PresetThemeColors() {
    return (
        <>
            <PresetThemeColorTable
                title="Canvas"
                description="Canvas is the page or app background role. Use it with the regular background color shorthand."
                rows={canvasRows}
            />
            <PresetThemeColorTable
                title="Surfaces"
                description="Surface tokens are for panels, cards, floating layers, and inverse blocks. Use the dedicated surface shorthand so only surface roles match."
                rows={surfaceRows}
            />
            <PresetThemeColorTable
                title="Base hue aliases"
                description="Base hue aliases are mode-aware shortcuts for common color choices. Use palette steps when you need a fixed swatch instead."
                rows={baseHueRows}
            >
                <BaseHueDemo />
            </PresetThemeColorTable>
            <PresetThemeColorTable
                title="Text hue aliases"
                description="Text hue aliases choose foreground-oriented palette steps for light and dark modes."
                rows={textRows}
            >
                <TextHueDemo />
            </PresetThemeColorTable>
        </>
    )
}
