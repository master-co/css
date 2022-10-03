import { BLOCK, dash, DISPLAY, FLEX, GRID, INLINE, TABLE, CONTENTS, NONE, FLOW, LIST, ITEM, ROW, COLUMN, GROUP } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Display extends MasterCSSRule {
    static override matches = /^d:./;
    static override key = DISPLAY;
    static override semantics = {
        hidden: NONE,
        hide: NONE,
        block: BLOCK,
        table: TABLE,
        flex: FLEX,
        grid: GRID,
        contents: CONTENTS,
        inline: INLINE,
        'inline-block': dash(INLINE, BLOCK),
        'inline-flex': dash(INLINE, FLEX),
        'inline-grid': dash(INLINE, GRID),
        'inline-table': dash(INLINE, TABLE),
        'table-cell': dash(TABLE, 'cell'),
        'table-caption': dash(TABLE, 'caption'),
        'flow-root': dash(FLOW, 'root'),
        'list-item': dash(LIST, ITEM),
        'table-row': dash(TABLE, ROW),
        'table-column': dash(TABLE, COLUMN),
        'table-row-group': dash(TABLE, ROW, GROUP),
        'table-column-group': dash(TABLE, COLUMN, GROUP),
        'table-header-group': dash(TABLE, 'header', GROUP),
        'table-footer-group': dash(TABLE, 'footer', GROUP)
    }
}