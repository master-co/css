import { BACKDROP, DASH, FILTER } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class BackdropFilterStyle extends Style {
    static override prefixes = /^bd:/;
    static override property = BACKDROP + DASH + FILTER;
}