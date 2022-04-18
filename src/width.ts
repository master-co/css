import { SIZING_VALUES, WIDTH } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class Width extends Style {
    static override matches = /^w:./;
    static override key = WIDTH;
    static override values = SIZING_VALUES;
}