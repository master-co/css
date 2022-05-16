import { COLUMN, dash, DIRECTION, FLEX, REVERSE } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexDirection extends Style {
    static override matches = /^flex:((row|col|column)(-reverse)?)(?!;)/;
    static override key = dash(FLEX, DIRECTION);
    static override values = {
        col: COLUMN,
        'col-reverse': dash(COLUMN, REVERSE)
    };
}