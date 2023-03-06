import { BOX_UNDERNEATH } from '../constants/box-underneath'
import { CONTENT_EXTREMA } from '../constants/content-extrema'

const values = {
    BackgroundClip: BOX_UNDERNEATH,
    BackgroundOrigin: BOX_UNDERNEATH,
    BoxSizing: {
        content: 'content-box',
        border: 'border-box',
    },
    ClipPath: {
        margin: 'margin-box',
        fill: 'fill-box',
        stroke: 'stroke-box',
        view: 'view-box'
    },
    FlexDirection: {
        col: 'column',
        'col-reverse': 'column-reverse'
    },
    FontFamily: {
        mono: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
        sans: 'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
        serif: 'ui-serif,Georgia,Cambria,Times New Roman,Times,serif'
    },
    FontWeight: {
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
    GridAutoColumns: CONTENT_EXTREMA,
    GridAutoRows: CONTENT_EXTREMA,
    GridTemplateColumns: CONTENT_EXTREMA,
    GridTemplateRows: CONTENT_EXTREMA,
    Order: {
        first: -999999,
        last: 999999
    },
    Position: {
        abs: 'absolute',
        rel: 'relative'
    },
    ShapeOutside: {
        margin: 'margin-box'
    },
    TransformBox: {
        fill: 'fill-box',
        stroke: 'stroke-box',
        view: 'view-box'
    },
    Width: BOX_UNDERNEATH,
    MinWidth: BOX_UNDERNEATH,
    MinHeight: BOX_UNDERNEATH,
    MaxWidth: BOX_UNDERNEATH,
    MaxHeight: BOX_UNDERNEATH,
    Height: BOX_UNDERNEATH,
    FlexBasis: BOX_UNDERNEATH
};

/* @__PURE__ */
(() => {
    Object.assign(values.ClipPath, BOX_UNDERNEATH)
    Object.assign(values.ShapeOutside, BOX_UNDERNEATH)
    Object.assign(values.TransformBox, BOX_UNDERNEATH)
})()

export { values }