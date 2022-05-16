import { BASIS, dash, FLEX, SIZING_VALUES } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexBasis extends Style {
    static override key = dash(FLEX, BASIS);
    static override values = SIZING_VALUES;
}