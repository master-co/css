import { Semantics } from './index'

export const semantics: Semantics = {
    square: {
        aspectRatio: '1/1'
    },
    video: {
        aspectRatio: '16/9'
    },
    rounded: {
        borderRadius: '1e9em'
    },
    round: {
        borderRadius: '50%'
    },
    hidden: {
        display: 'none'
    },
    hide: {
        display: 'none'
    },
    block: {
        display: 'block'
    },
    table: {
        display: 'table'
    },
    flex: {
        display: 'flex'
    },
    grid: {
        display: 'grid'
    },
    contents: {
        display: 'contents'
    },
    inline: {
        display: 'inline'
    },
    'inline-block': {
        display: 'inline-block'
    },
    'inline-flex': {
        display: 'inline-flex'
    },
    'inline-grid': {
        display: 'inline-grid'
    },
    'inline-table': {
        display: 'inline-table'
    },
    'table-cell': {
        display: 'table-cell'
    },
    'table-caption': {
        display: 'table-caption'
    },
    'flow-root': {
        display: 'flow-root'
    },
    'list-item': {
        display: 'list-item'
    },
    'table-row': {
        display: 'table-row'
    },
    'table-column': {
        display: 'table-column'
    },
    'table-row-group': {
        display: 'table-row-group'
    },
    'table-column-group': {
        display: 'table-column-group'
    },
    'table-header-group': {
        display: 'table-header-group'
    },
    'table-footer-group': {
        display: 'table-footer-group'
    },
    italic: {
        fontStyle: 'italic'
    },
    oblique: {
        fontStyle: 'oblique'
    },
    isolate: {
        isolation: 'isolate'
    },
    overflowed: {
        overflow: 'visible'
    },
    untouchable: {
        pointerEvents: 'none'
    },
    static: {
        position: 'static'
    },
    fixed: {
        position: 'fixed'
    },
    abs: {
        position: 'absolute'
    },
    rel: {
        position: 'relative'
    },
    sticky: {
        position: 'sticky'
    },
    uppercase: {
        textTransform: 'uppercase'
    },
    lowercase: {
        textTransform: 'lowercase'
    },
    capitalize: {
        textTransform: 'capitalize'
    },
    visible: {
        visibility: 'visible'
    },
    invisible: {
        visibility: 'hidden'
    },
    vw: {
        width: '100vw'
    },
    vh: {
        height: '100vh'
    },
    'max-vw': {
        maxWidth: '100vw'
    },
    'max-vh': {
        maxHeight: '100vh'
    },
    'min-vw': {
        minWidth: '100vw'
    },
    'min-vh': {
        minHeight: '100vh'
    },
    'center-content': {
        justifyContent: 'center',
        alignItems: 'center',
    },
    'sr-only': {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        borderWidth: '0'
    },
    full: {
        width: '100%',
        height: '100%'
    },
    center: {
        left: 0,
        right: 0,
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    middle: {
        top: 0,
        bottom: 0,
        marginTop: 'auto',
        marginBottom: 'auto'
    },
    'break-spaces': {
        whiteSpace: 'break-spaces'
    },
    'break-word': {
        overflowWrap: 'break-word',
        overflow: 'hidden'
    },
    'gradient-text': {
        WebkitTextFillColor: 'transparent',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text'
    },
    fit: {
        width: 'fit-content',
        height: 'fit-content'
    }
}