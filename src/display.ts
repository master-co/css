import { BLOCK, DASH, DISPLAY, FLEX, GRID, INLINE, TABLE, CONTENTS, NONE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class Display extends Style {
    static override matches = /^d:./;
    static override key = DISPLAY;
    static override semantics = {
        hidden: NONE,
        hide: NONE,
        block: BLOCK,
        table: TABLE,
        contents: CONTENTS,
        'inline-block': INLINE + DASH + BLOCK,
        'inline-flex': INLINE + DASH + FLEX,
        'inline-grid': INLINE + DASH + GRID,
        'inline-table': INLINE + DASH + TABLE
    }
}