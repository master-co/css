import { Style } from '@master/css';
import clsx from 'clsx';
import { Fragment } from 'react';
const contrast = require("get-contrast")

const ObjectSchemes = ({ children, name }: any) => {
    const schemes = children
    return (
        <div className="grid-cols:5 mt:40">
            {
                [name || 'Colors', 'Preview', 'Normal', 'Hover', 'Active']
                    .map((label, index) => (
                        <b key={label} className="f:12 mb:10">{label}</b>
                    ))
            }
            {
                Object.keys(schemes)
                    .map((colorName: string) => {
                        const currentColor = Style.colors[colorName];
                        const object: any = schemes[colorName];
                        const foregroundHex = object.fore
                            ? '#' + (object.fore === 100 ? '000' : currentColor[object.fore])
                            : '#' + (object.fore === 0 ? 'fff' : (currentColor[''] ?? currentColor['50']))
                        // const hex = '#' + rgbToHex(+rgb[0], +rgb[1], +rgb[2])
                        return (
                            <Fragment key={colorName}>
                                <div className='f:bold capitalize flex align-items:center'>
                                    {colorName}
                                </div>
                                <button className={clsx(
                                        'flex center-content f:bold f:14 ls:.5 w:full h:40 capitalize',
                                        object.bgs.map((background: any, index: number) => {
                                            let selector = '';
                                            switch (index) {
                                                case 1:
                                                    selector = ':hover';
                                                    break;
                                                case 2:
                                                    selector = ':active';
                                                    break;
                                            }
                                            return 'bg:' + (
                                                background === 100
                                                    ? '#000'
                                                    : (background === 0
                                                        ? '#fff'
                                                        : background ? (colorName + '-' + background) : colorName
                                                    )
                                            ) + selector
                                        }).join(' ')
                                    )}
                                    style={{ color: foregroundHex }}>
                                    Aa
                                </button>
                                {
                                    object.bgs.map((background: any) => {
                                        const backgroundHex = background === 100
                                            ? '#000'
                                            : (background === 0
                                                ? '#fff'
                                                : '#' + (currentColor[background] ?? currentColor[50])
                                            )
                                        return (
                                            <div key={colorName + backgroundHex}>
                                                <div className="flex center-content ls:.5 w:full f:14 h:40 hide:hover>.ratio block:hover>.level"
                                                    style={{
                                                        backgroundColor: backgroundHex,
                                                        color: foregroundHex
                                                    }}>
                                                    {/* <span className="ratio">{Math.round(contrast.ratio(backgroundHex, foregroundHex) * 10) / 10}</span> */}
                                                    <span className="level hide">{object.fore} / {background}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </Fragment>
                        )
                    })
            }
        </div>
    )
}

export default ObjectSchemes
