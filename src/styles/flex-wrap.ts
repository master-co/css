import { dash, FLEX, WRAP } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexWrap extends Style {
    static override matches = /^flex:(wrap(-reverse)?|nowrap)(?!;)/;
    static override key = dash(FLEX, WRAP);
}