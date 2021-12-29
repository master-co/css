import { COLUMN, DASH, DIRECTION, FLEX, REVERSE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexDirectionStyle extends Style {
    static override matches = /^flex:((row|col|column)(-reverse)?)(?!;)/;
    static override key = FLEX + DASH + DIRECTION;
    static override values = {
        col: COLUMN,
        'col-reverse': COLUMN + DASH + REVERSE
    };
}