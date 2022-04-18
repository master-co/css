import { MIN_WIDTH, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class MinWidth extends Style {
    static override matches = /^min-w:./;
    static override key = MIN_WIDTH;
    static override values = SIZING_VALUES;
}