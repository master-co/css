import { Fragment } from 'react'
import { l } from 'to-line'
// @ts-expect-error
import contrast from 'get-contrast'

import { fillColorScale } from '@master/css'

const colors = {
    black: '#000000',
    white: '#ffffff',
    slate: fillColorScale({
        10: '#19212d',
        20: '#262f3e',
        30: '#323e52',
        40: '#41516b',
        50: '#616a84',
        55: '#6c7693',
        60: '#959db3',
        70: '#a3abbf',
        80: '#d7dae3',
        95: '#f6f7f8'
    }),
    gray: fillColorScale({
        10: '#212022',
        20: '#2f2e30',
        30: '#3e3d40',
        40: '#504f52',
        50: '#6b6a6d',
        55: '#777679',
        60: '#9e9da0',
        70: '#abaaae',
        80: '#dad9db',
        95: '#f5f4f7'
    }),
    brown: fillColorScale({
        10: '#2b1e18',
        20: '#3c2b22',
        30: '#50382c',
        40: '#694839',
        50: '#8d604b',
        55: '#9d6b53',
        60: '#b79788',
        70: '#c1a598',
        80: '#efd5c9',
        95: '#faf2ef'
    }),
    orange: fillColorScale({
        10: '#331b07',
        20: '#47260b',
        30: '#5d320e',
        40: '#7a4111',
        50: '#a15717',
        55: '#b4611a',
        60: '#e38739',
        70: '#e79855',
        80: '#f7d4b5',
        95: '#fcf1e7'
    }),
    gold: fillColorScale({
        10: '#2d1e01',
        20: '#3f2a00',
        30: '#543800',
        40: '#6d4900',
        50: '#906000',
        55: '#9c6d00',
        60: '#d09100',
        70: '#dca000',
        80: '#fbd67f',
        95: '#fff3d8'
    }),
    yellow: fillColorScale({
        10: '#282000',
        20: '#3a2e01',
        30: '#4b3b00',
        40: '#624e00',
        50: '#806700',
        55: '#8e7200',
        60: '#be9900',
        70: '#d0a700',
        80: '#edda8f',
        95: '#fff5ca'
    }),
    grass: fillColorScale({
        10: '#182406',
        20: '#223308',
        30: '#2c4408',
        40: '#3a570b',
        50: '#4e750e',
        60: '#74ae15',
        70: '#7dbc17',
        80: '#bfe87c',
        95: '#ebfad4'
    }),
    green: fillColorScale({
        10: '#032611',
        20: '#023717',
        30: '#03481f',
        40: '#025d26',
        50: '#067b34',
        55: '#07883a',
        60: '#09b64d',
        70: '#0ac553',
        80: '#80f1a4',
        95: '#e0fae8'
    }),
    beryl: fillColorScale({
        10: '#00271c',
        20: '#003626',
        30: '#004732',
        40: '#005c41',
        50: '#007954',
        55: '#00875e',
        60: '#00b37c',
        70: '#00c387',
        80: '#72f0c5',
        95: '#d6fcef'
    }),
    teal: fillColorScale({
        10: '#012624',
        20: '#003532',
        30: '#004541',
        40: '#005a54',
        50: '#00776f',
        55: '#00857c',
        60: '#00b1a5',
        70: '#00bfb2',
        80: '#6aeee5',
        95: '#d4fcf8'
    }),
    cyan: fillColorScale({
        10: '#00252e',
        20: '#013340',
        30: '#004457',
        40: '#00576f',
        50: '#007391',
        55: '#0080a1',
        60: '#00abd7',
        70: '#00b9e9',
        80: '#97e6fa',
        95: '#dff8ff'
    }),
    sky: fillColorScale({
        10: '#032339',
        20: '#04314e',
        30: '#044169',
        40: '#065386',
        50: '#086eb3',
        55: '#097ac5',
        60: '#29a4f5',
        70: '#4db3f7',
        80: '#b3e0ff',
        95: '#eaf6fe'
    }),
    blue: fillColorScale({
        10: '#081c53',
        20: '#0a2773',
        30: '#0e3496',
        40: '#1146b6',
        50: '#175fe9',
        55: '#2671ea',
        60: '#6b9ef1',
        70: '#81acf3',
        80: '#c6dbfe',
        95: '#edf4fe'
    }),
    indigo: fillColorScale({
        10: '#20174f',
        20: '#2b1f74',
        30: '#37289d',
        40: '#463fb1',
        50: '#5a5bd5',
        55: '#6464f1',
        60: '#9393f5',
        70: '#a1a5ee',
        80: '#d5d7fe',
        95: '#f1f2ff'
    }),
    violet: fillColorScale({
        10: '#2e0b57',
        20: '#3d1179',
        30: '#4e169f',
        40: '#5f2eba',
        50: '#7949e5',
        55: '#8755f5',
        60: '#ac8af8',
        70: '#b89bf9',
        80: '#e1d4fe',
        95: '#f5f1ff'
    }),
    purple: fillColorScale({
        10: '#330c4e',
        20: '#460f6c',
        30: '#5b1390',
        40: '#7421b1',
        50: '#9832e4',
        55: '#a348e7',
        60: '#c184ef',
        70: '#ca96f1',
        80: '#ead1fe',
        95: '#f9f0ff'
    }),
    fuchsia: fillColorScale({
        10: '#400932',
        20: '#560d4a',
        30: '#6f1165',
        40: '#8c158a',
        50: '#b61cbb',
        55: '#ca1fce',
        60: '#e66ee9',
        70: '#ea86ed',
        80: '#facbfb',
        95: '#feefff'
    }),
    pink: fillColorScale({
        10: '#430725',
        20: '#5d0933',
        30: '#790d44',
        40: '#9a1058',
        50: '#ca1473',
        55: '#e11681',
        60: '#f170b4',
        70: '#f388c0',
        80: '#fdcde6',
        95: '#fff0f8'
    }),
    crimson: fillColorScale({
        10: '#470314',
        20: '#62041c',
        30: '#800524',
        40: '#9f1036',
        50: '#ce1a4b',
        55: '#e8144c',
        60: '#f37596',
        70: '#f58ba7',
        80: '#fdceda',
        95: '#fff1f4'
    }),
    red: fillColorScale({
        10: '#490102',
        20: '#640304',
        30: '#800506',
        40: '#a11012',
        50: '#d11a1e',
        55: '#ed0a0e',
        60: '#f97476',
        70: '#fa8b8d',
        80: '#fdcfcf',
        95: '#fff1f1'
    })
}

export default async function Page(props: any) {
    return (
        <>
            {/* light */}
            <div className="grid-cols:6 grid-cols:13@sm">
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>Name</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>5</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>10</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>20</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>30</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>40</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>50</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>55</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>60</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>70</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>80</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>90</div>
                <div className={l`flex center-content font:12 font:extrabold h:40 capitalize`}>95</div>
                {Object.keys(colors)
                    .filter((colorName) => colorName !== 'black' && colorName !== 'white')
                    .map((colorName: string) => {
                        const eachColors = (colors as any)[colorName]
                        return (
                            <Fragment key={colorName}>
                                <div className={l`flex center-content font:12 font:semibold capitalize`}>{colorName}</div>
                                {Object.keys(eachColors)
                                    .filter((level: any) => [5, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 95].includes(+level))
                                    .map((level: any) => {
                                        const color = eachColors[level]
                                        const backgroundHex = level === 100 ? '#000000' : color === 0 ? '#ffffff' : color
                                        const ratio = Math.round(contrast.ratio(backgroundHex, '#ffffff') * 10) / 10
                                        return (
                                            <div key={color + level}>
                                                <div className="center-content flex font:12 h:40 ls:.5 w:full"
                                                    style={{
                                                        backgroundColor: backgroundHex,
                                                        color: ratio > 4.5 ? '#fff' : '#000',
                                                        boxShadow: 'inset 0 0 1px rgba(255,255,255,.3)'
                                                    }}
                                                >
                                                    {/* <div className="info invisible lh:1">#{color}</div> */}
                                                </div>
                                                {/* <code className="block mt:8 font:12">{level}</code> */}
                                                {/* <code className="block mt:4 font:10 fg:neutral">{color}</code> */}
                                                {/* <code className="block mt:4 font:10 fg:neutral">{ratio}</code> */}
                                            </div>
                                        )
                                    })}
                            </Fragment>
                        )
                    })}
            </div>
        </>
    )
}