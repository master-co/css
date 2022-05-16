import { Style } from '../style';
import { COLUMNS } from '../constants/css-property-keyword';

export class Columns extends Style {
    static override matches = /^(columns|cols):./;
    static override key = COLUMNS;
    static override unit = '';
    override order = -1;
}