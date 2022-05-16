import { dash, FLEX, GROW } from '../constants/css-property-keyword';
import { Style } from '../style';

export class FlexGrow extends Style {
    static override key = dash(FLEX, GROW);
    static override unit = '';
}