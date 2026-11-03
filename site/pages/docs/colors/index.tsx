import type { NextPage } from 'next'
import { Fragment } from 'react';
import CssDoc from '~/layouts/CssDoc'
import React from '../setup/react';
import { Style } from '@master/css'
import { rgbToHex } from '~/utils/rgbToHex';
// import ObjectSchemes from './ObjectSchemes';
import Code from '~/components/Code';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
const contrast = require("get-contrast")

export default function Colors() {
    const colors = Style.colors;
    return (
        <>
            <div className="grid-cols:2 grid-cols:3@xs grid-cols:5@md gap:15">
                {
                    Object.keys(colors)
                        .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                        .map((colorName: string) => {
                            const eachColor = colors[colorName];
                            const hex = '#' + eachColor[50];
                            return (
                                <div key={colorName}>
                                    <div className={`flex center-content f:white f:14 w:full h:40 r:3 b:1|solid|fade-20/.2 b:white/.2@dark bg:${colorName}`}>
                                        {Math.round(contrast.ratio(hex, '#fff') * 10) / 10}
                                    </div>
                                    <div className="mt:6 flex align-items:center">
                                        <span className="f:14 f:medium">{colorName}</span>
                                        <code className="f:12 f:gray-60! ml:auto">{hex}</code>
                                    </div>
                                </div>
                            )
                        })
                }
            </div>
            <h2 id="overview">Overview</h2>
            <p>
                The palettes comply <a href="https://www.w3.org/TR/WCAG20/" target="blank">WCAG 2.0</a> <b>4.5:1</b> contrast ratio at <b>Level AA</b>.
            </p>
            <div className="mx:-20@<sm grid-cols:9 mt:40">
                {
                    [10, 20, 30, 40, 50, 60, 70, 80, 90]
                        .map((label, index) => (
                            <b key={label} className="f:12 mb:10 t:center">{label}</b>
                        ))
                }
                {
                    Object.keys(Style.colors)
                        .map((colorName: string) => {
                            const colors = Style.colors[colorName];
                            return (
                                <Fragment key={colorName}>
                                    {
                                        Object.keys(colors)
                                            .filter((level) => level && +level % 10 === 0)
                                            .map((level: any) => {
                                                const color = colors[level];
                                                const backgroundHex = level === 100
                                                    ? '#000000'
                                                    : (color === 0
                                                        ? '#ffffff'
                                                        : '#' + color
                                                    )
                                                const ratio = Math.round(contrast.ratio(backgroundHex, '#ffffff') * 10) / 10;
                                                return (
                                                    <div key={color + level} >
                                                        <div className="flex center-content ls:.5 w:full f:12 h:40"
                                                            style={{
                                                                backgroundColor: backgroundHex,
                                                                color: ratio > 4.5 ? '#fff' : '#000'
                                                            }}>
                                                            {/* <span className="ratio">{ratio}</span> */}
                                                            <span className="ratio invisible">{level}</span>
                                                        </div>
                                                        {/* <div className="mt:10 f:12">#{color}</div> */}
                                                    </div>
                                                )
                                            })
                                    }
                                </Fragment>
                            )
                        })
                }
            </div>
            <p>A range of out-of-the-box color palettes with levels from 2, 4, 6 ... 98.</p>
            <div className="grid-cols:1 mt:-20">
                {
                    Object.keys(colors)
                        .filter((colorName: string) => colorName !== 'black' && colorName !== 'white')
                        .map((colorName: string) => {
                            const eachColor = colors[colorName];
                            const hex = '#' + eachColor[''];
                            return (<Fragment key={colorName}>
                                <div className="mt:40 mb:10 flex align-items:center">
                                    <svg className={`w:16 h:16 mr:8 bg:${colorName}`}></svg>
                                    <span className="f:semibold capitalize">{colorName}</span>
                                    <code className="f:12 ml:8 f:gray-60!">{hex}</code>
                                </div>
                                <div className="grid-cols:10 grid-cols:25@xs gap:1 font-color:transparent!:not(:hover)_div">
                                    {
                                        Object.keys(eachColor)
                                            .filter((level: string) => level !== '')
                                            .map((level: string) => {
                                                const hexColor = '#' + eachColor[level];
                                                const ratio = contrast.ratio(hexColor, '#fff')
                                                return (
                                                    <div key={hexColor}
                                                        className="w:full square flex center-content f:12"
                                                        style={{
                                                            backgroundColor: hexColor,
                                                            color: ratio >= 4.5 ? '#fff' : '#000'
                                                        }}>
                                                        {level}
                                                    </div>
                                                )
                                            })
                                    }
                                </div>
                            </Fragment>)
                        })
                }
            </div>
            {/* <h3 id="filled-colors-for-objects">Filled colors for objects</h3>
            <ObjectSchemes name="Strong">{
                {
                    fade: { fore: 0, bgs: ['', 60, 66] },
                    gray: { fore: 0, bgs: ['', 62, 68] },
                    brown: { fore: 0, bgs: ['', 62, 68] },
                    orange: { fore: 0, bgs: ['', 68, 72] },
                    gold: { fore: 0, bgs: ['', 74, 78] },
                    yellow: { fore: 0, bgs: ['', 78, 80] },
                    grass: { fore: 0, bgs: ['', 76, 80] },
                    green: { fore: 0, bgs: ['', 78, 80] },
                    beryl: { fore: 0, bgs: ['', 78, 82] },
                    teal: { fore: 0, bgs: ['', 80, 82] },
                    cyan: { fore: 0, bgs: ['', 74, 78] },
                    sky: { fore: 0, bgs: ['', 68, 72] },
                    blue: { fore: 0, bgs: ['', 54, 60] },
                    indigo: { fore: 0, bgs: ['', 44, 48] },
                    violet: { fore: 0, bgs: ['', 44, 52] },
                    purple: { fore: 0, bgs: ['', 52, 58] },
                    fuchsia: { fore: 0, bgs: ['', 64, 68] },
                    pink: { fore: 0, bgs: ['', 62, 66] },
                    crimson: { fore: 0, bgs: ['', 60, 64] },
                    red: { fore: 0, bgs: ['', 60, 64] }
                }
            }</ObjectSchemes>
            <ObjectSchemes name="Dark">{
                {
                    fade: { fore: 38, bgs: [86, 82, 80] },
                    gray: { fore: 40, bgs: [86, 84, 82] },
                    brown: { fore: 40, bgs: [86, 84, 82] },
                    orange: { fore: 50, bgs: [88, 86, 84] },
                    gold: { fore: 60, bgs: [90, 88, 86] },
                    yellow: { fore: 66, bgs: [92, 90, 88] },
                    grass: { fore: 62, bgs: [92, 90, 88] },
                    green: { fore: 64, bgs: [92, 90, 88] },
                    beryl: { fore: 66, bgs: [92, 90, 88] },
                    teal: { fore: 66, bgs: [92, 90, 88] },
                    cyan: { fore: 60, bgs: [90, 88, 86] },
                    sky: { fore: 48, bgs: [88, 84, 82] },
                    blue: { fore: 34, bgs: [84, 80, 78] },
                    indigo: { fore: 28, bgs: [82, 74, 72] },
                    violet: { fore: 28, bgs: [82, 76, 74] },
                    purple: { fore: 30, bgs: [84, 80, 78] },
                    fuchsia: { fore: 36, bgs: [88, 84, 82] },
                    pink: { fore: 34, bgs: [86, 84, 82] },
                    crimson: { fore: 34, bgs: [86, 82, 80] },
                    red: { fore: 32, bgs: [86, 82, 80] },
                }
            }</ObjectSchemes>
            <ObjectSchemes name="Light">{
                {
                    fade: { fore: 58, bgs: [6, 10, 12] },
                    gray: { fore: 60, bgs: [6, 8, 10] },
                    brown: { fore: 62, bgs: [8, 12, 14] },
                    orange: { fore: 66, bgs: [8, 10, 12] },
                    gold: { fore: 72, bgs: [8, 12, 16] },
                    yellow: { fore: 76, bgs: [10, 14, 16] },
                    grass: { fore: 74, bgs: [10, 14, 16] },
                    green: { fore: 74, bgs: [8, 12, 14] },
                    beryl: { fore: 76, bgs: [8, 12, 16] },
                    teal: { fore: 76, bgs: [8, 12, 14] },
                    cyan: { fore: 72, bgs: [8, 12, 14] },
                    sky: { fore: 64, bgs: [6, 8, 10] },
                    blue: { fore: 52, bgs: [4, 6, 10] },
                    indigo: { fore: 42, bgs: [4, 6, 8] },
                    violet: { fore: 44, bgs: [4, 6, 8] },
                    purple: { fore: 50, bgs: [4, 6, 8] },
                    fuchsia: { fore: 60, bgs: [4, 6, 8] },
                    pink: { fore: 58, bgs: [4, 6, 8] },
                    crimson: { fore: 56, bgs: [4, 6, 8] },
                    red: { fore: 56, bgs: [4, 6, 8] }
                }
            }</ObjectSchemes> */}
            <h2 id="other-palettes">Other palettes</h2>
            <p>We&#39;ve organized some well-known palettes, just copying and pasting to import them completely.</p>
            <h3 id="IBM">IBM</h3>
            <p>The <a href="https://www.ibm.com/design/language/color" target="blank">IBM Color palette</a> is blue at the core, expanding across color families and gradients, using specifications to represent mankind and machine in action.</p>
            <Code lang="js" name="master.css.js" lineNumbers>{`
                /* 1. Prevent @master/css from initializing automatically */
                window.MasterCSSManual = true;
                /* 2. Access APIs */
                import { init, Style } from '@master/css';
                /* 3. Customize initial configurations here ... */
                Style.extend('colors', {
                    red:            { 100: '2d0709', 90: '520408', 80: '750e13', 70: 'a2191f', 60: 'da1e28', 50: 'fa4d56', 40: 'ff8389', 30: 'ffb3b8', 20: 'ffd7d9', 10: 'fff1f1' },
                    magenta:        { 100: '2a0a18', 90: '510224', 80: '740937', 70: '9f1853', 60: 'd02670', 50: 'ee5396', 40: 'ff7eb6', 30: 'ffafd2', 20: 'ffd6e8', 10: 'fff0f7' },
                    purple:         { 100: '1c0f30', 90: '31135e', 80: '491d8b', 70: '6929c4', 60: '8a3ffc', 50: 'a56eff', 40: 'be95ff', 30: 'd4bbff', 20: 'e8daff', 10: 'f6f2ff' },
                    blue:           { 100: '001141', 90: '001d6c', 80: '002d9c', 70: '0043ce', 60: '0f62fe', 50: '4589ff', 40: '78a9ff', 30: 'a6c8ff', 20: 'd0e2ff', 10: 'edf5ff' },
                    cyna:           { 100: '061727', 90: '012749', 80: '003a6d', 70: '00539a', 60: '0072c3', 50: '1192e8', 40: '33b1ff', 30: '82cfff', 20: 'bae6ff', 10: 'e5f6ff' },
                    teal:           { 100: '081a1c', 90: '022b30', 80: '004144', 70: '005d5d', 60: '007d79', 50: '009d9a', 40: '08bdba', 30: '3ddbd9', 20: '9ef0f0', 10: 'd9fbfb' },
                    green:          { 100: '071908', 90: '022d0d', 80: '044317', 70: '0e6027', 60: '198038', 50: '24a148', 40: '42be65', 30: '6fdc8c', 20: 'a7f0ba', 10: 'defbe6' },
                    gray:           { 100: '161616', 90: '262626', 80: '393939', 70: '525252', 60: '6f6f6f', 50: '8d8d8d', 40: 'a8a8a8', 30: 'c6c6c6', 20: 'e0e0e0', 10: 'f4f4f4' },
                    'coll-gray':    { 100: '121619', 90: '21272a', 80: '343a3f', 70: '4d5358', 60: '697077', 50: '878d96', 40: 'a2a9b0', 30: 'c1c7cd', 20: 'dde1e6', 10: 'f2f4f8' },
                    'warn-gray':    { 100: '171414', 90: '272525', 80: '3c3838', 70: '565151', 60: '726e6e', 50: '8f8b8b', 40: 'ada8a8', 30: 'cac5c4', 20: 'e5e0df', 10: 'f7f3f2' },
                })
                /* 4. Manually initialize */
                init()
            `}</Code>
        </>
    )
}

const localeNamespace = 'docs.css.colors'

Colors.page = {
    layout: CssDoc,
    title: 'Colors',
    description: 'The palettes comply WCAG 2.0 4.5:1 contrast ratio at Level AA.',
    editors: ['Miles', 'Aron'],
    localeNamespace
}

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
