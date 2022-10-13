import { defaultBreakpoints } from './breakpoints';

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
for (const key in defaultBreakpoints) {
    sizingValues[key] = (defaultBreakpoints[key] / 16) + 'rem'
}

export const defaultValues = {
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
        col: COLUMN,
        'col-reverse': 'column-reverse'
    },
    FontFamily: {
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
        sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji',
        serif: 'ui-serif, Georgia, Cambria, Times New Roman, Times, serif'
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