import { BOX_UNDERNEATH } from '../constants/box-underneath'
import { CONTENT_EXTREMA } from '../constants/content-extrema'
import { SIZING_VALUES } from '../constants/sizing-values'

const values = {
    backgroundClip: BOX_UNDERNEATH,
    backgroundOrigin: BOX_UNDERNEATH,
    boxSizing: {
        content: 'content-box',
        border: 'border-box',
    },
    clipPath: {
        margin: 'margin-box',
        fill: 'fill-box',
        stroke: 'stroke-box',
        view: 'view-box'
    },
    flexDirection: {
        col: 'column',
        'col-reverse': 'column-reverse'
    },
    fontFamily: {
        mono: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
        sans: 'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
        serif: 'ui-serif,Georgia,Cambria,Times New Roman,Times,serif'
    },
    fontWeight: {
        thin: 100,
        extralight: 200,
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        heavy: 900
    },
    gridAutoColumns: CONTENT_EXTREMA,
    gridAutoRows: CONTENT_EXTREMA,
    gridTemplateColumns: CONTENT_EXTREMA,
    gridTemplateRows: CONTENT_EXTREMA,
    order: {
        first: -999999,
        last: 999999
    },
    position: {
        abs: 'absolute',
        rel: 'relative'
    },
    shapeOutside: {
        margin: 'margin-box'
    },
    transformBox: {
        fill: 'fill-box',
        stroke: 'stroke-box',
        view: 'view-box'
    },
    width: SIZING_VALUES,
    minWidth: SIZING_VALUES,
    minHeight: SIZING_VALUES,
    maxWidth: SIZING_VALUES,
    maxHeight: SIZING_VALUES,
    height: SIZING_VALUES,
    flexBasis: SIZING_VALUES
};

/* @__PURE__ */
(() => {
    Object.assign(values.clipPath, BOX_UNDERNEATH)
    Object.assign(values.shapeOutside, BOX_UNDERNEATH)
    Object.assign(values.transformBox, BOX_UNDERNEATH)
})()

export { values }