import { DASH, FLEX, GROW } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexGrow extends Style {
    static override key = FLEX + DASH + GROW;
    static override unit = '';
}