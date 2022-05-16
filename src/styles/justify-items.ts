import { dash, ITEMS, JUSTIFY } from '../constants/css-property-keyword';
import { Style } from '../style';

export class JustifyItems extends Style {
    static override matches =  /^ji:./;
    static override key = dash(JUSTIFY, ITEMS);

}