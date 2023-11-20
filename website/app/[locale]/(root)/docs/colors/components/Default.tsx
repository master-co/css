'use client'

import { variables } from '@master/css'
import { Fragment } from 'react'
import { l } from 'to-line'
// @ts-expect-error
import contrast from 'get-contrast'
import { snackbar } from 'websites/utils/snackbar'

export default () => <div className="gap:25|10 grid-cols:6 grid-cols:13@sm my:40">
    {Object.keys(variables)
        // @ts-ignore todo fix this
        .filter((variableName) => ['slate', 'gray', 'brown', 'orange', 'gold', 'yellow', 'grass', 'green', 'beryl', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'crimson', 'red'].includes(variableName))
        .map((colorName: string) => {
            const eachColors = (variables as any)[colorName]
            return (
                <Fragment key={colorName}>
                    <div className={l`font:12 font:semibold capitalize white-space:pre-line lh:1.5`}>{colorName}</div>
                    {Object.keys(eachColors)
                        .filter((level: any) => [5, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 95].includes(+level))
                        .map((level: any) => {
                            const color = eachColors[level]
                            const backgroundHex = level === 100 ? '#000000' : color === 0 ? '#ffffff' : color
                            const ratio = Math.round(contrast.ratio(backgroundHex, '#ffffff') * 10) / 10
                            return (
                                <div key={color + level}>
                                    <div className="center-content flex cursor:pointer font:12 h:40 ls:.5 r:5 w:full"
                                        style={{
                                            backgroundColor: backgroundHex,
                                            color: ratio > 4.5 ? '#fff' : '#000',
                                            boxShadow: 'inset 0 0 1px rgba(255,255,255,.3)'
                                        }}
                                        onClick={() => {
                                            snackbar(
                                                `Copied <svg class="v:middle mt:-2 ml:4 mr:2 inline-block w:6 h:6 round bg:${backgroundHex}"></svg> <b>${backgroundHex}</b>`
                                            )
                                            navigator.clipboard.writeText(backgroundHex)
                                        }}
                                    >
                                        {/* <div className="info invisible lh:1">#{color}</div> */}
                                    </div>
                                    <code className="block font:12 mt:8">{level}</code>
                                    <code className="block fg:neutral font:10 mt:4">{color}</code>
                                    {/* <code className="block mt:4 font:10 fg:neutral">{ratio}</code> */}
                                </div>
                            )
                        })}
                </Fragment>
            )
        })}
</div>