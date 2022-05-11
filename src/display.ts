import { BLOCK, dash, DISPLAY, FLEX, GRID, INLINE, TABLE, CONTENTS, NONE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class Display extends Style {
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
        'inline-block': dash(INLINE, BLOCK),
        'inline-flex': dash(INLINE, FLEX),
        'inline-grid': dash(INLINE, GRID),
        'inline-table': dash(INLINE, TABLE)
    }
}