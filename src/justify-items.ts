import { dash, ITEMS, JUSTIFY } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class JustifyItems extends Style {
    static override key = dash(JUSTIFY, ITEMS);

}