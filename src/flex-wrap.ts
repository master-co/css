import { DASH, FLEX, WRAP } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexWrapStyle extends Style {
    static override matches = /^flex:(wrap(-reverse)?|nowrap)/;
    static override key = FLEX + DASH + WRAP;
}