import { breakpoints } from '../'

const boxUnderneath = {
    content: 'content-box',
    border: 'border-box',
    padding: 'padding-box'
}

const contentExtrema = {
    min: 'min-content',
    max: 'max-content'
}

const sizingValues = {
    full: '100%',
    fit: 'fit-content',
    max: 'max-content',
    min: 'min-content',
}
for (const key in breakpoints) {
    sizingValues[key] = (breakpoints[key] / 16) + 'rem'
}

export const values = {
    BackgroundClip: boxUnderneath,
    BackgroundOrigin: boxUnderneath,
    BoxSizing: {
        content: 'content-box',
        border: 'border-box',
    },
    ClipPath: {
        ...boxUnderneath,
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
    GridAutoColumns: contentExtrema,
    GridAutoRows: contentExtrema,
    GridTemplateColumns: contentExtrema,
    GridTemplateRows: contentExtrema,
    Order: {
        first: -999999,
        last: 999999
    },
    Position: {
        abs: 'absolute',
        rel: 'relative'
    },
    ShapeOutside: {
        ...boxUnderneath,
        margin: 'margin-box'
    },
    TransformBox: {
        ...boxUnderneath,
        fill: 'fill-box',
        stroke: 'stroke-box',
        view: 'view-box'
    },
    Width: sizingValues,
    MinWidth: sizingValues,
    MinHeight: sizingValues,
    MaxWidth: sizingValues,
    MaxHeight: sizingValues,
    Height: sizingValues,
    FlexBasis: sizingValues
}