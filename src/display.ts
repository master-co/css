import { BLOCK, DASH, DISPLAY, FLEX, GRID, INLINE, TABLE, CONTENTS, NONE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class DisplayStyle extends Style {
    static override matches = /^d:/;
    static override key = DISPLAY;
    static override semantics = {
        'hidden': NONE
    }
}

for (const value of [
    BLOCK,
    FLEX,
    GRID,
    TABLE,
    CONTENTS,
    INLINE + DASH + BLOCK,
    INLINE + DASH + FLEX,
    INLINE + DASH + GRID,
    INLINE + DASH + TABLE
]) {
    DisplayStyle.semantics[value] = value
}