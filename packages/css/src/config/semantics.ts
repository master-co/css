const semantics = {
    square: {
        'aspect-ratio': '1/1'
    },
    video: {
        'aspect-ratio': '16/9'
    },
    rounded: {
        'border-radius': '1e9em'
    },
    round: {
        'border-radius': '50%'
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
        'font-style': 'italic'
    },
    oblique: {
        'font-style': 'oblique'
    },
    isolate: {
        isolation: 'isolate'
    },
    overflowed: {
        overflow: 'visible'
    },
    untouchable: {
        'pointer-events': 'none'
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
        'text-transform': 'uppercase'
    },
    lowercase: {
        'text-transform': 'lowercase'
    },
    capitalize: {
        'text-transform': 'capitalize'
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
        'max-width': '100vw'
    },
    'max-vh': {
        'max-height': '100vh'
    },
    'min-vw': {
        'min-width': '100vw'
    },
    'min-vh': {
        'min-height': '100vh'
    },
    'center-content': {
        'justify-content': 'center',
        'align-items': 'center',
    },
    'sr-only': {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        'white-space': 'nowrap',
        'border-width': '0'
    },
    full: {
        width: '100%',
        height: '100%'
    },
    center: {
        left: 0,
        right: 0,
        'margin-left': 'auto',
        'margin-right': 'auto'
    },
    middle: {
        top: 0,
        bottom: 0,
        'margin-top': 'auto',
        'margin-bottom': 'auto'
    },
    'break-spaces': {
        'white-space': 'break-spaces'
    },
    'break-word': {
        'overflow-wrap': 'break-word',
        overflow: 'hidden'
    },
    'gradient-text': {
        '-webkit-text-fill-color': 'transparent',
        '-webkit-background-clip': 'text',
        'background-clip': 'text'
    },
    fit: {
        width: 'fit-content',
        height: 'fit-content'
    }
} as const

export default semantics