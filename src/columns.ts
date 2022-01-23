import { Style } from '@master/style';
import { COLUMNS } from './constants/css-property-keyword';

export class ColumnsStyle extends Style {
    static override matches = /^(columns|cols):./;
    static override key = COLUMNS;
    static override unit = '';
}