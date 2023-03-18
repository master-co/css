import type { CompletionItem } from 'vscode-languageserver'

export const defaultClassNameMatches = [
    '(class(?:Name)?\\s?=\\s?)((?:"[^"]+")|(?:\'[^\']+\')|(?:`[^`]+`))',
    '(class(?:Name)?={)([^}]*)}',
    '(?:(\\$|(?:(?:element|el|style)\\.[^\\s.`]+)`)([^`]+)`)',
    '(style\\.(?:.*)\\()([^)]*)\\)',
    '(classList.(?:add|remove|replace|replace|toggle)\\()([^)]*)\\)',
    '(template\\s*\\:\\s*)((?:"[^"]+")|(?:\'[^\']+\')|(?:`[^`]+`))',
    '(?<=classes\\s*(?:=|:)\\s*{[\\s\\S]*)([^\']*)(\'[^\']*\')',
    '(?<=classes\\s*(?:=|:)\\s*{[\\s\\S]*)([^"]*)("[^"]*")',
    '(?<=classes\\s*(?:=|:)\\s*{[\\s\\S]*)([^`]*)(`[^`]*`)'
]

interface MasterCssKey {
    key: string[];
    colored: boolean,
    values: Array<string | CompletionItem>;
}

export const masterCssSelectors = [
    { label: 'lang()', kind: 3 }, { label: 'has()', kind: 3 }, 'any-link', 'link', 'visited', 'target', 'scope', 'hover', 'active', 'focus', 'focus-visible', 'focus-within',
    'autofill', 'enabled', 'disabled', 'read-only', 'read-write', 'placeholder-shown', 'default', 'checked', 'indeterminate', 'valid', 'invalid', 'in-range',
    'out-of-range', 'required', 'optional', 'root', 'empty',
    { label: 'nth-child()', kind: 3 },
    { label: 'nth-last-child()', kind: 3 }, 'first-child', 'last-child', 'only-child',
    { label: 'nth-of-type()', kind: 3 },

    { label: 'nth-last-of-type()', kind: 3 }, 'first-of-type', 'last-of-type', 'only-of-type', 'defined', 'first', 'fullscreen',
    { label: 'host()', kind: 3 },
    { label: 'host-context()', kind: 3 },
    { label: 'is()', kind: 3 }, 'left',
    { label: 'not()', kind: 3 },
    'right',
    { label: 'where()', kind: 3 }
]

export const masterCssElements = ['after', 'before', 'backdrop', 'cue', 'first-letter', 'first-line', 'file-selector-button', 'marker',
    { label: 'part()', kind: 3 }, 'placeholder'
    , 'selection',
    { label: 'slotted()', kind: 3 }, 'resizer',
    'search-cancel-button', 'search-results-button'
]

export const masterCssMedia = [
    'all', 'print', 'screen', 'portrait', 'landscape', 'motion', 'reduced-motion',
    { label: 'media()', kind: 3 }
]

export const masterCssOtherKeys = [
    'ext', 'gap', 'ont', 'ovf', 'quotes', 'bottom', 'center', 'left', 'middle', 'top', 'right', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'mx', 'my', 'mt', 'mb', 'ml', 'mr'
]

export const masterCssCommonValues = [
    { label: 'var()', kind: 3 },
    { label: 'calc()', kind: 3 },
    'inherit',
    'initial',
    'unset'
]

export const commonUnit: any = [
    { label: '0%', kind: 11 },
    { label: '0ch', kind: 11 },
    { label: '0cm', kind: 11 },
    { label: '0em', kind: 11 },
    { label: '0ex', kind: 11 },
    { label: '0fr', kind: 11 },
    { label: '0in', kind: 11 },
    { label: '0mm', kind: 11 },
    { label: '0pc', kind: 11 },
    { label: '0pt', kind: 11 },
    { label: '0px', kind: 11 },
    { label: '0rem', kind: 11 },
    { label: '0vh', kind: 11 },
    { label: '0vmax', kind: 11 },
    { label: '0vmin', kind: 11 },
    { label: '0vw', kind: 11 }
]

export const masterCssKeyValues: MasterCssKey[] = [
    {
        key: ['color', 'fg', 'foreground'],
        colored: true,
        values: []
    },
    //APPEARANCE
    {
        key: ['font-color', 'font', 'f'],
        colored: true,
        values: []
    },
    {
        key: ['accent-color', 'accent'],
        colored: true,
        values: []
    },
    {
        key: ['appearance'],
        colored: false,
        values: ['none', 'auto', 'menulist-button', 'textfield', 'button', 'searchfield', 'textarea', 'push-button', 'slider-horizontal', 'checkbox', 'radio', 'square-button', 'menulist', 'listbox', 'meter', 'progress-bar']
    },
    {
        key: ['caret-color', 'caret'],
        colored: true,
        values: ['transparent']
    },
    {
        key: ['cursor'],
        colored: false,
        values: ['auto', 'alias', 'all-scroll', 'cell', 'col-resize', 'context-menu', 'copy', 'crosshair', 'default', 'e-resize', 'ew-resize', 'grab', 'grabbing', 'help', 'move', 'n-resize', 'ne-resize', 'nesw-resize', 'no-drop', 'none', 'not-allowed', 'ns-resize', 'nw-resize', 'nwse-resize', 'pointer', 'progress', 'row-resize', 's-resize', 'se-resize', 'sw-resize', 'text', 'vertical-text', 'w-resize', 'wait', 'zoom-in', 'zoom-out']
    },


    //LAYOUT
    {
        key: ['box-decoration-break', 'box'],
        colored: false,
        values: ['slice', 'clone']
    },
    {
        key: ['break-after', 'break-before'],
        colored: false,
        values: ['avoid-column', 'column', 'left', 'page', 'recto', 'right', 'recto', 'verso', 'auto', 'avoid', 'avoid-column', 'avoid-page', 'revert']
    },
    {
        key: ['break-inside'],
        colored: false,
        values: ['auto', 'avoid', 'avoid-column', 'avoid-page', 'revert']
    },
    {
        key: ['clear'],
        colored: false,
        values: ['both', 'left', 'none', 'right']
    },
    {
        key: ['columns', 'cols'],
        colored: false,
        values: []
    },
    {
        key: ['column-span', 'col-span'],
        colored: false,
        values: ['all', 'none']
    },
    {
        key: ['direction'],
        colored: false,
        values: ['ltr', 'rtl']
    },
    {
        key: ['display', 'd'],
        colored: false,
        values: ['hidden', 'hide', 'flex', 'grid', 'inline', 'none', 'block', 'table', 'contents', 'inline-block', 'inline-flex', 'inline-grid', 'inline-table', 'table-cell', 'table-caption', 'flow-root', 'list-item', 'table-row', 'table-column', 'table-row-group', 'table-column-group', 'table-header-group', 'table-footer-group']
    },
    {
        key: ['float'],
        colored: false,
        values: ['left', 'none', 'right']
    },
    {
        key: ['inset'],
        colored: false,
        values: []
    },
    {
        key: ['isolation'],
        colored: false,
        values: ['auto', 'isolate']
    },
    {
        key: ['overflow', 'overflow-x', 'overflow-y'],
        colored: false,
        values: ['auto', 'hidden', 'overlay', 'scroll', 'visible', 'clip']
    },
    {
        key: ['position'],
        colored: false,
        values: ['absolute', 'relative', 'static', 'fixed', 'sticky']
    },
    {
        key: ['z-index', 'z'],
        colored: false,
        values: []
    },
    //FLEX
    {
        key: ['flex'],
        colored: false,
        values: []
    },
    {
        key: ['flex-basis'],
        colored: false,
        values: ['100%', 'fit-content', 'max-content', 'min-content']
    },
    {
        key: ['flex-direction', 'flex'],
        colored: false,
        values: ['column', 'row', 'column-reverse', 'row-reverse']
    },
    {
        key: ['flex-grow', 'flex-shrink'],
        colored: false,
        values: []
    },
    {
        key: ['flex-wrap', 'flex'],
        colored: false,
        values: ['wrap', 'wrap-reverse', 'nowrap']
    },
    //GRID
    {
        key: ['grid'],
        colored: false,
        values: []
    },
    {
        key: ['grid-auto-columns', 'grid-auto-cols'],
        colored: false,
        values: ['auto', 'min-content', 'max-content',
            { label: 'minmax(,)', kind: 3 }]
    },
    {
        key: ['grid-auto-flow'],
        colored: false,
        values: ['row', 'column', 'dense', 'row|dense', 'column|dense']
    },
    {
        key: ['grid-auto-rows'],
        colored: false,
        values: ['auto', 'min-content', 'max-content',
            { label: 'minmax(,)', kind: 3 }]
    },
    {
        key: ['grid-column', 'grid-col', 'grid-column-span', 'grid-col-span', 'grid-column-start', 'grid-col-start', 'grid-column-end', 'grid-col-end'],
        colored: false,
        values: []
    },
    {
        key: ['grid-columns', 'grid-cols'],
        colored: false,
        values: []
    },
    {
        key: ['grid-row', 'grid-row-span', 'grid-row-start', 'grid-row-end'],
        colored: false,
        values: []
    },
    {
        key: ['grid-rows'],
        colored: false,
        values: []
    },
    {
        key: ['grid-template'],
        colored: false,
        values: ['none']
    },
    {
        key: ['grid-template-areas', 'grid-area'],
        colored: false,
        values: ['none']
    },
    {
        key: ['grid-template-columns', 'grid-template-cols'],
        colored: false,
        values: ['none', 'min-content', 'max-content',
            { label: 'repeat(,)', kind: 3 },
            { label: 'fit-content()', kind: 3 },
            { label: 'minmax()', kind: 3 }]
    },
    {
        key: ['grid-template-rows'],
        colored: false,
        values: ['none', 'min-content', 'max-content',
            { label: 'repeat(,)', kind: 3 },
            { label: 'fit-content()', kind: 3 },
            { label: 'minmax()', kind: 3 }]
    },
    //GRID AND FLEXBOX
    {
        key: ['align-content', 'ac'],
        colored: false,
        values: ['space-around', 'space-between', 'space-evenly', 'normal', 'baseline', 'center', 'stretch', 'start', 'end', 'flex-start', 'flex-end']
    },
    {
        key: ['align-items', 'ai'],
        colored: false,
        values: ['self-start', 'self-end', 'normal', 'baseline', 'center', 'stretch', 'start', 'end', 'flex-start', 'flex-end']
    },
    {
        key: ['align-self', 'as'],
        colored: false,
        values: ['auto', 'self-start', 'self-end', 'normal', 'baseline', 'center', 'stretch', 'start', 'end', 'flex-start', 'flex-end']
    },
    {
        key: ['justify-content', 'jc'],
        colored: false,
        values: ['space-around', 'space-between', 'space-evenly', 'normal', 'left', 'center', 'right', 'stretch', 'start', 'end', 'flex-start', 'flex-end']
    },
    {
        key: ['justify-items', 'ji'],
        colored: false,
        values: ['self-start', 'self-end', 'normal', 'left', 'center', 'right', 'stretch', 'start', 'end', 'flex-start', 'flex-end']
    },
    {
        key: ['justify-self', 'js'],
        colored: false,
        values: ['auto', 'self-start', 'self-end', 'normal', 'left', 'center', 'right', 'stretch', 'start', 'end', 'flex-start', 'flex-end']
    },
    {
        key: ['order', 'o'],
        colored: false,
        values: []
    },
    {
        key: ['place-content'],
        colored: false,
        values: ['space-around', 'space-between', 'space-evenly', 'normal', 'baseline', 'center', 'stretch', 'start', 'end', 'flex-start', 'flex-end']
    },
    {
        key: ['place-items'],
        colored: false,
        values: ['self-start', 'self-end', 'normal', 'baseline', 'center', 'stretch', 'start', 'end', 'flex-start', 'flex-end']
    },
    {
        key: ['place-self'],
        colored: false,
        values: ['auto', 'self-start', 'self-end', 'normal', 'baseline', 'center', 'stretch', 'start', 'end', 'flex-start', 'flex-end']
    },
    //TABLES
    {
        key: ['border-collapse', 'border'],
        colored: false,
        values: ['collapse', 'separate']
    },
    {
        key: ['table-layout'],
        colored: false,
        values: ['auto', 'fixed']
    },
    //MEDIA
    {
        key: ['object-fit'],
        colored: false,
        values: ['none']
    },
    {
        key: ['object-fit', 'object', 'obj'],
        colored: false,
        values: ['contain', 'cover', 'fill', 'scale-down']
    },
    {
        key: ['object-position', 'object', 'obj'],
        colored: false,
        values: ['top', 'bottom', 'left', 'right', 'center']
    },
    //FONT
    {
        key: ['font', 'f'],
        colored: false,
        values: ['caption', 'icon', 'menu', 'message-box', 'small-caption', 'status-bar']
    },
    {
        key: ['font-color', 'font', 'f'],
        colored: true,
        values: []
    },
    {
        key: ['font-family', 'font', 'f'],
        colored: false,
        values: [
            '\'CourierNew\',Courier,monospace',
            '\'FranklinGothicMedium\',\'ArialNarrow\',Arial,sans-serif',
            '\'GillSans\',\'GillSansMT\',Calibri,\'TrebuchetMS\',sans-serif',
            '\'LucidaSans\',\'LucidaSansRegular\',\'LucidaGrande\',\'LucidaSansUnicode\',Geneva,Verdana,sans-serif',
            '\'SegoeUI\',Tahoma,Geneva,Verdana,sans-serif',
            '\'TimesNewRoman\',Times,serif',
            '\'TrebuchetMS\',\'LucidaSansUnicode\',\'LucidaGrande\',\'LucidaSans\',Arial,sans-serif',
            'Arial,Helvetica,sans-serif',
            'Cambria,Cochin,Georgia,Times,\'TimesNewRoman\',serif',
            'Georgia,\'TimesNewRoman\',Times,serif',
            'Impact,Haettenschweiler,\'ArialNarrowBold\',sans-serif',
            'Verdana,Geneva,Tahoma,sans-serif',
            'cursive',
            'fantasy',
            'monospace',
            'sans-serif',
            'serif',
            '-apple-system,BlinkMacSystemFont,\'SegoeUI\',Roboto,Oxygen,Ubuntu,Cantarell,\'OpenSans\',\'HelveticaNeue\',sans-serif'
        ]
    },
    {
        key: ['font-size', 'font', 'f'],
        colored: false,
        values: [
            { label: '8', kind: 11, sortText: '!0' },
            { label: '9', kind: 11, sortText: '!1' },
            { label: '10', kind: 11, sortText: '!2' },
            { label: '11', kind: 11, sortText: '!2' },
            { label: '12', kind: 11, sortText: '!2' },
            { label: '14', kind: 11, sortText: '!2' },
            { label: '16', kind: 11, sortText: '!2' },
            { label: '18', kind: 11, sortText: '!2' },
            { label: '20', kind: 11, sortText: '!2' },
            { label: '22', kind: 11, sortText: '!2' },
            { label: '24', kind: 11, sortText: '!2' },
            { label: '26', kind: 11, sortText: '!2' },
            { label: '28', kind: 11, sortText: '!2' },
            { label: '36', kind: 11, sortText: '!2' },
            { label: '48', kind: 11, sortText: '!2' },
            { label: '72', kind: 11, sortText: '!2' },
        ]
    },
    {
        key: ['font-style'],
        colored: false,
        values: ['oblique|deg']
    },
    {
        key: ['font-style', 'font', 'f'],
        colored: false,
        values: ['normal', 'italic', 'oblique']
    },
    {
        key: ['font-variant-numeric', 'font', 'f'],
        colored: false,
        values: ['normal', 'ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions']
    },
    {
        key: ['font-weight', 'font', 'f'],
        colored: false,
        values: [
            '100',
            '200',
            '300',
            '400',
            '500',
            '600',
            '700',
            '800',
            '900'
        ]
    },
    {
        key: ['font', 'f'],
        colored: false,
        values: ['antialiased', 'subpixel-antialiased']
    },
    //TEXT
    {
        key: ['text-align', 'text', 't'],
        colored: false,
        values: ['start', 'end', 'left', 'right', 'center', 'justify']
    },
    {
        key: ['text-decoration', 'text', 't'],
        colored: false,
        values: ['underline', 'line-through', 'overline']
    },
    {
        key: ['text-decoration-color', 'text-decoration'],
        colored: true,
        values: []
    },
    {
        key: ['text-decoration-line', 'text', 't'],
        colored: false,
        values: ['none', 'underline', 'overline', 'line-through']
    },
    {
        key: ['text-decoration-style', 'text', 't'],
        colored: false,
        values: ['dashed', 'dotted', 'double', 'solid', 'wavy']
    },
    {
        key: ['text-decoration-thickness'],
        colored: false,
        values: []
    },
    {
        key: ['text-fill-color', 'text-fill'],
        colored: true,
        values: []
    },
    {
        key: ['text-indent'],
        colored: false,
        values: []
    },
    {
        key: ['text-orientation', 'text', 't'],
        colored: false,
        values: ['mixed', 'sideways', 'sideways-right', 'upright', 'use-glyph-orientation']
    },
    {
        key: ['text-overflow', 'text', 't'],
        colored: false,
        values: ['clip', 'ellipsis']
    },
    {
        key: ['text-shadow'],
        colored: false,
        values: []
    },
    {
        key: ['text', 't'],
        colored: false,
        values: []
    },
    {
        key: ['text-stroke'],
        colored: false,
        values: []
    },
    {
        key: ['text-stroke-color', 'text-stroke'],
        colored: true,
        values: []
    },
    {
        key: ['text-stroke-width', 'text-stroke'],
        colored: false,
        values: []
    },
    {
        key: ['text-transform'],
        colored: false,
        values: ['none']
    },
    {
        key: ['text-transform', 'text', 't'],
        colored: false,
        values: ['capitalize', 'lowercase', 'uppercase']
    },
    {
        key: ['text-underline-offset'],
        colored: false,
        values: []
    },
    {
        key: ['text-rendering'],
        colored: false,
        values: ['auto']
    },
    {
        key: ['text-rendering', 't'],
        colored: false,
        values: ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision']
    },
    //LIST STYLE
    {
        key: ['list-style'],
        colored: false,
        values: []
    },
    {
        key: ['list-style-image', 'list-style'],
        colored: false,
        values: [
            { label: 'url()', kind: 3 },
            { label: 'linear-gradient()', kind: 3 },
            { label: 'radial-gradient()', kind: 3 },
            { label: 'repeating-linear-gradient()', kind: 3 },
            { label: 'repeating-radial-gradient()', kind: 3 },
            { label: 'conic-gradient()', kind: 3 }]
    },
    {
        key: ['list-style-position', 'list-style'],
        colored: false,
        values: ['inside', 'outside']
    },
    {
        key: ['list-style-type'],
        colored: false,
        values: ['circle', 'square', 'decimal-leading-zero', 'lower-roman', 'lower-greek', 'lower-alpha', 'lower-latin', 'upper-roman', 'upper-alpha', 'upper-latin', 'arabic-indic', 'armenian', 'bengali', 'cambodian/khmer', 'cjk-earthly-branch', 'cjk-heavenly-stem', 'devanagari', 'georgian', 'gurmukhi', 'kannada', 'lao', 'malayalam', 'myanmar', 'oriya', 'telugu', 'thai']
    },
    {
        key: ['list-style-type', 'list-style'],
        colored: false,
        values: ['none', 'disc', 'decimal']
    },
    //TYPOGRAPHY
    {
        key: ['letter-spacing', 'ls'],
        colored: false,
        values: []
    },
    {
        key: ['lines'],
        colored: false,
        values: []
    },
    {
        key: ['line-height', 'lh'],
        colored: false,
        values: []
    },
    {
        key: ['content'],
        colored: false,
        values: ['normal', 'none', 'no-open-quote', 'no-close-quote',
            { label: 'url()', kind: 3 },
            { label: 'linear-gradient()', kind: 3 },
            { label: 'image-set()', kind: 3 },
            { label: 'counter()', kind: 3 },
            { label: 'attr()', kind: 3 }]
    },
    {
        key: ['vertical-align', 'v'],
        colored: false,
        values: ['baseline', 'bottom', 'middle', 'sub', 'super', 'text-bottom', 'text-top', 'top']
    },
    {
        key: ['white-space'],
        colored: false,
        values: ['break-spaces', 'normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap']
    },
    {
        key: ['word-break'],
        colored: false,
        values: ['normal', 'break-all', 'keep-all']
    },
    {
        key: ['word-spacing'],
        colored: false,
        values: []
    },
    {
        key: ['writing-mode'],
        colored: false,
        values: ['horizontal-tb', 'vertical-rl', 'vertical-lr', 'lr', 'lr-tb', 'rl', 'rl-tb', 'tb', 'tb-rl']
    },
    //BACKGROUND
    {
        key: ['background', 'bg'],
        colored: false,
        values: []
    },
    {
        key: ['backdrop-filter', 'bd'],
        colored: false,
        values: ['none',
            { label: 'url()', kind: 3 },
            { label: 'blur()', kind: 3 },
            { label: 'brightness()', kind: 3 },
            { label: 'contrast()', kind: 3 },
            { label: 'grayscale()', kind: 3 },
            { label: 'hue-rotate(degree)', kind: 3 },
            { label: 'invert()', kind: 3 },
            { label: 'sepia()', kind: 3 },
            { label: 'saturate()', kind: 3 },
            { label: 'opacity()', kind: 3 },
            { label: 'drop-shadow()', kind: 3 }]
    },
    {
        key: ['background-attachment', 'background', 'bg'],
        colored: false,
        values: ['fixed', 'local', 'scroll']
    },
    {
        key: ['background-blend-mode'],
        colored: false,
        values: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']
    },
    {
        key: ['background-clip', 'bg'],
        colored: false,
        values: ['content-box', 'border-box', 'padding-box']
    },
    {
        key: ['background-color', 'background', 'bg'],
        colored: true,
        values: ['transparent']
    },
    {
        key: ['background-image', 'background', 'bg'],
        colored: false,
        values: [
            { label: 'url()', kind: 3 },
            { label: 'linear-gradient()', kind: 3 },
            { label: 'radial-gradient()', kind: 3 },
            { label: 'repeating-linear-gradient()', kind: 3 },
            { label: 'repeating-radial-gradient()', kind: 3 },
            { label: 'conic-gradient()', kind: 3 }]
    },
    {
        key: ['background-origin', 'bg'],
        colored: false,
        values: ['content-box', 'border-box', 'padding-box']
    },
    {
        key: ['background-position', 'bg'],
        colored: false,
        values: ['top', 'bottom', 'left', 'right', 'center']
    },
    {
        key: ['background-repeat', 'bg'],
        colored: false,
        values: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y']
    },
    {
        key: ['background-size', 'background', 'bg'],
        colored: false,
        values: ['auto', 'cover', 'contain']
    },
    {
        key: ['mix-blend-mode', 'blend'],
        colored: false,
        values: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']
    },
    //BORDER
    {
        key: ['border', 'border-top', 'border-bottom', 'border-left', 'border-right', 'b', 'bt', 'bb', 'bl', 'br', 'bx', 'by'],
        colored: false,
        values: []
    },
    {
        key: ['border-spacing'],
        colored: false,
        values: []
    },
    {
        key: ['border-color', 'border', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'b', 'bt', 'bb', 'bl', 'br', 'bx', 'by'],
        colored: true,
        values: []
    },
    {
        key: ['border-radius', 'r', 'rt', 'rb', 'rl', 'rr', 'border-top-left-radius', 'rlt', 'rtl', 'border-top-right-radius', 'rrt', 'rtr'
            , 'border-bottom-left-radius', 'rlb', 'rbl', 'border-bottom-right-radius', 'rbr', 'rrb'
        ],
        colored: false,
        values: []
    },
    {
        key: ['border-style', 'border', 'b', 'border-top-style', 'border-top', 'bt', 'border-bottom-style', 'border-bottom', 'bb', 'border-left-style', 'border-left', 'bl', 'border-right-style', 'border-right', 'br', 'bx', 'by'],
        colored: false,
        values: ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
    },
    {
        key: ['border-width', 'border', 'b', 'border-top-width', 'border-top', 'bt', 'border-bottom-width', 'border-bottom', 'bb', 'border-left-width', 'border-left', 'bl', 'border-right-width', 'border-right', 'br', 'bx', 'by'],
        colored: false,
        values: []
    },

    //OUTLINE
    {
        key: ['outline'],
        colored: false,
        values: []
    },
    {
        key: ['outline-color', 'outline'],
        colored: true,
        values: []
    },
    {
        key: ['outline-offset'],
        colored: false,
        values: []
    },
    {
        key: ['outline-style', 'outline'],
        colored: false,
        values: ['none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
    },
    {
        key: ['outline-width', 'outline'],
        colored: false,
        values: ['medium', 'thick', 'thin']
    },
    //SHAPE
    {
        key: ['shape-image-threshold'],
        colored: false,
        values: []
    },
    {
        key: ['shape-margin', 'shape'],
        colored: false,
        values: [
            { label: 'max()', kind: 3 },
            { label: 'min()', kind: 3 },
            { label: 'calc()', kind: 3 },
            { label: 'clamp()', kind: 3 }]
    },
    {
        key: ['shape-outside', 'shape'],
        colored: false,
        values: ['none', 'content-box', 'border-box', 'padding-box', 'margin-box',
            { label: 'inset()', kind: 3 },
            { label: 'circle()', kind: 3 },
            { label: 'ellipse()', kind: 3 },
            { label: 'polygon()', kind: 3 },
            { label: 'url()', kind: 3 },
            { label: 'linear-gradient()', kind: 3 }]
    },
    {
        key: ['clip-path', 'clip'],
        colored: false,
        values: [
            'none',
            'content-box',
            'border-box',
            'padding-box',
            'margin-box',
            'fill-box',
            'stroke-box',
            'view-box',
            { label: 'inset()', kind: 3 },
            { label: 'circle()', kind: 3 },
            { label: 'ellipse()', kind: 3 },
            { label: 'polygon()', kind: 3 },
            { label: 'path()', kind: 3 },
            { label: 'url()', kind: 3 }]
    },
    //SIZING
    {
        key: ['aspect-ratio', 'aspect'],
        colored: false,
        values: []
    },
    {
        key: ['box-sizing', 'box'],
        colored: false,
        values: ['content-box', 'border-box']
    },
    {
        key: ['width', 'w'],
        colored: false,
        values: ['100%', 'fit-content', 'max-content', 'min-content']
    },
    {
        key: ['min-width', 'min-w'],
        colored: false,
        values: ['100%', 'fit-content', 'max-content', 'min-content']
    },
    {
        key: ['max-width', 'max-w'],
        colored: false,
        values: ['100%', 'fit-content', 'max-content', 'min-content']
    },
    {
        key: ['height', 'h'],
        colored: false,
        values: ['100%', 'fit-content', 'max-content', 'min-content']
    },
    {
        key: ['min-height', 'min-h'],
        colored: false,
        values: ['100%', 'fit-content', 'max-content', 'min-content']
    },
    {
        key: ['max-height', 'max-h'],
        colored: false,
        values: ['100%', 'fit-content', 'max-content', 'min-content']
    },
    //TYPOGRAPHY
    {
        key: ['letter-spacing', 'ls'],
        colored: false,
        values: []
    },
    {
        key: ['margin-top', 'mt', 'margin-bottom', 'mb', 'margin-left', 'ml', 'margin-right', 'mr', 'margin', 'm', 'mx', 'my'],
        colored: false,
        values: [...commonUnit]
    },
    {
        key: ['padding-top', 'pt', 'padding-bottom', 'pb', 'padding-left', 'pl', 'padding-right', 'pr', 'padding', 'p', 'px', 'py'],
        colored: false,
        values: [...commonUnit]
    },
    {
        key: ['word-spacing'],
        colored: false,
        values: []
    },
    //TRANSITION
    {
        key: ['transition'],
        colored: false,
        values: []
    },
    {
        key: ['transition-delay', '~delay'],
        colored: false,
        values: []
    },
    {
        key: ['transition-duration', '~duration'],
        colored: false,
        values: []
    },
    {
        key: ['transition-property', '~property'],
        colored: false,
        values: []
    },
    {
        key: ['transition-timing-function', '~easing'],
        colored: false,
        values: ['ease', 'ease-in', 'ease-out', 'linear', 'step-start', 'step-end',
            { label: 'steps(,)', kind: 3 },
            { label: 'cubic-bezier(,,,)', kind: 3 },
            { label: 'frames()', kind: 3 }]
    },
    //TRANSFORM
    {
        key: ['transform'],
        colored: false,
        values: [
            { label: 'translate()', kind: 3 },
            { label: 'translate3d()', kind: 3 },
            { label: 'translateX()', kind: 3 },
            { label: 'translateY()', kind: 3 },
            { label: 'translateZ()', kind: 3 },
            { label: 'scale()', kind: 3 },
            { label: 'scale3d()', kind: 3 },
            { label: 'scaleX()', kind: 3 },
            { label: 'scaleY()', kind: 3 },
            { label: 'scaleZ()', kind: 3 },
            { label: 'skew()', kind: 3 },
            { label: 'skewX()', kind: 3 },
            { label: 'skewY()', kind: 3 },
            { label: 'rotate()', kind: 3 },
            { label: 'rotate3d()', kind: 3 },
            { label: 'rotateX()', kind: 3 },
            { label: 'rotateY()', kind: 3 },
            { label: 'rotateZ()', kind: 3 },
            { label: 'perspective()', kind: 3 },
            { label: 'matrix()', kind: 3 },
            { label: 'matrix3d()', kind: 3 }]
    },
    {
        key: ['transform-box', 'transform'],
        colored: false,
        values: [
            'content-box',
            'fill-box',
            'stroke-box',
            'view-box',
            'border-box'
        ]
    },
    {
        key: ['transform-origin', 'transform'],
        colored: false,
        values: ['top', 'bottom', 'right', 'left', 'center']
    },
    {
        key: ['transform-style', 'transform'],
        colored: false,
        values: ['flat', 'preserve-3d']
    },
    //ANIMATION
    {
        key: ['animation'],
        colored: false,
        values: []
    },
    {
        key: ['animation-delay', '@delay'],
        colored: false,
        values: []
    },
    {
        key: ['animation-direction', '@direction'],
        colored: false,
        values: ['normal', 'reverse', 'alternate', 'alternate-reverse']
    },
    {
        key: ['animation-duration', '@duration'],
        colored: false,
        values: []
    },
    {
        key: ['animation-fill-mode', '@fill-mode'],
        colored: false,
        values: ['none', 'forwards', 'backwards', 'both']
    },
    {
        key: ['animation-iteration-count', '@iteration-count'],
        colored: false,
        values: ['infinite']
    },
    {
        key: ['animation-name', '@name'],
        colored: false,
        values: []
    },
    {
        key: ['animation-play-state', '@play-state'],
        colored: false,
        values: ['running', 'paused']
    },
    {
        key: ['animation-timing-function', '@easing'],
        colored: false,
        values: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end',
            { label: 'steps(,)', kind: 3 },
            { label: 'cubic-bezier(,,,)', kind: 3 },
            { label: 'frames()', kind: 3 }]
    },
    //SVG
    {
        key: ['fill'],
        colored: true,
        values: []
    },
    {
        key: ['stroke'],
        colored: true,
        values: []
    },
    {
        key: ['stroke-width'],
        colored: false,
        values: []
    },
    //VISIBILITY
    {
        key: ['opacity'],
        colored: false,
        values: []
    },
    {
        key: ['visibility'],
        colored: false,
        values: ['visible', 'invisible', 'collapse']
    },
    //EFFECT

    {
        key: ['backdrop-filter', 'bd'],
        colored: false,
        values: ['none',
            { label: 'url(svg)', kind: 3 },
            { label: 'blur()', kind: 3 },
            { label: 'brightness()', kind: 3 },
            { label: 'contrast()', kind: 3 },
            { label: 'grayscale()', kind: 3 },
            { label: 'hue-rotate(degree)', kind: 3 },
            { label: 'invert()', kind: 3 },
            { label: 'sepia()', kind: 3 },
            { label: 'saturate()', kind: 3 },
            { label: 'opacity()', kind: 3 },
            { label: 'drop-shadow()', kind: 3 }]
    },
    {
        key: ['background-blend-mode'],
        colored: false,
        values: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']
    },
    {
        key: ['box-shadow', 'shadow', 's'],
        colored: true,
        values: ['inset']
    },
    {
        key: ['filter'],
        colored: false,
        values: ['none',
            { label: 'url()', kind: 3 },
            { label: 'blur()', kind: 3 },
            { label: 'brightness()', kind: 3 },
            { label: 'contrast()', kind: 3 },
            { label: 'drop-shadow()', kind: 3 },
            { label: 'grayscale()', kind: 3 },
            { label: 'hue-rotate(degree)', kind: 3 },
            { label: 'invert()', kind: 3 },
            { label: 'opacity()', kind: 3 },
            { label: 'saturate()', kind: 3 },
            { label: 'sepia()', kind: 3 }]
    },
    {
        key: ['mask-image'],
        colored: false,
        values: []
    },
    {
        key: ['mix-blend-mode', 'blend'],
        colored: false,
        values: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']
    },
    {
        key: ['text-shadow'],
        colored: false,
        values: []
    },
    //SCROLL
    {
        key: ['overscroll-behavior', 'overscroll-behavior-x', 'overscroll-behavior-y'],
        colored: false,
        values: ['auto', 'none', 'contain']
    },
    {
        key: ['scroll-behavior'],
        colored: false,
        values: ['auto', 'smooth']
    },
    {
        key: ['scroll-margin', 'scroll-m', 'scroll-margin-top', 'scroll-mt', 'scroll-margin-bottom', 'scroll-mb', 'scroll-margin-left', 'scroll-ml', 'scroll-margin-right', 'scroll-mr', 'scroll-mx', 'scroll-my'],
        colored: false,
        values: []
    },
    {
        key: ['scroll-padding', 'scroll-p', 'scroll-padding', 'scroll-padding-top', 'scroll-pt', 'scroll-padding-bottom', 'scroll-pb', 'scroll-padding-left', 'scroll-pl', 'scroll-padding-right', 'scroll-pr', 'scroll-px', 'scroll-py'],
        colored: false,
        values: []
    },
    {
        key: ['scroll-snap-align', 'scroll-snap'],
        colored: false,
        values: ['center', 'end', 'start', 'none']
    },
    {
        key: ['scroll-snap-stop', 'scroll-snap'],
        colored: false,
        values: ['always', 'normal']
    },
    {
        key: ['scroll-snap-type'],
        colored: false,
        values: ['none']
    },
    {
        key: ['scroll-snap-type', 'scroll-snap'],
        colored: false,
        values: ['x', 'y', 'both', 'block', 'inline', 'x|mandatory', 'y|proximity', 'both|mandatory']
    },
    //INTERACTIVITY

    {
        key: ['pointer-events'],
        colored: false,
        values: ['auto', 'none', 'visiblePainted', 'visibleFill', 'visibleStroke', 'visible', 'painted', 'fill', 'stroke', 'all', 'bounding-box']
    },
    {
        key: ['resize'],
        colored: false,
        values: ['auto', 'none', 'both', 'horizontal', 'vertical', 'block', 'inline']
    },
    {
        key: ['touch-action'],
        colored: false,
        values: ['auto', 'none', 'pan-x', 'pan-left', 'pan-right', 'pan-y', 'pan-up', 'pan-down', 'pinch-zoom', 'manipulation']
    },
    {
        key: ['user-drag'],
        colored: false,
        values: ['auto', 'none', 'element']
    },
    {
        key: ['user-select'],
        colored: false,
        values: ['all', 'auto', 'none', 'text']
    },
    //OPTIMIZATION
    {
        key: ['contain'],
        colored: false,
        values: ['none', 'strict', 'content', 'size', 'layout', 'style', 'paint']
    },
    {
        key: ['font', 'f'],
        colored: false,
        values: ['antialiased', 'subpixel-antialiased']
    },
    {
        key: ['text-rendering'],
        colored: false,
        values: ['auto']
    },
    {
        key: ['text-rendering', 't'],
        colored: false,
        values: ['optimizeSpeed', 'optimizeLegibility', 'geometricPrecision']
    },
    {
        key: ['will-change'],
        colored: false,
        values: []
    }
]

export const masterCssType = [
    {
        type: 'color',
        values: ['#',
            { label: 'rgb()', kind: 3 },
            { label: 'hsl()', kind: 3 }]
    }
]