const breakpoints = require('./breakpoints');
const { dash, FIT, MAX, MIN, CONTENT, COLUMN } = require('../constants/css-property-keyword');

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
    fit: dash(FIT, CONTENT),
    max: dash(MAX, CONTENT),
    min: dash(MIN, CONTENT),
}
for (const key in breakpoints) {
    sizingValues[key] = (breakpoints[key] / 16) + 'rem'
}

module.exports = {
    backgroundClip: boxUnderneath,
    backgroundOrigin: boxUnderneath,
    boxSizing: {
        content: 'content-box',
        border: 'border-box',
    },
    clipPath: {
        ...boxUnderneath,
        margin: 'margin-box',
        fill: 'fill-box',
        stroke: 'stroke-box',
        view: 'view-box'
    },
    flexDirection: {
        col: COLUMN,
        'col-reverse': 'column-reverse'
    },
    fontFamily: {
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
        sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji',
        serif: 'ui-serif, Georgia, Cambria, Times New Roman, Times, serif'
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
    gridAutoColumns: contentExtrema,
    gridAutoRows: contentExtrema,
    gridTemplateColumns: contentExtrema,
    gridTemplateRows: contentExtrema,
    order: {
        first: -999999,
        last: 999999
    },
    position: {
        abs: 'absolute',
        rel: 'relative'
    },
    shapeOutside: {
        ...boxUnderneath,
        margin: 'margin-box'
    },
    transformBox: {
        ...boxUnderneath,
        fill: 'fill-box',
        stroke: 'stroke-box',
        view: 'view-box'
    },
    width: sizingValues,
    minWidth: sizingValues,
    minHeight: sizingValues,
    maxWidth: sizingValues,
    maxHeight: sizingValues,
    height: sizingValues,
    flexBasis: sizingValues
}