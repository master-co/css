import { Style } from '@master/style';
import { BREAK, DASH, INSIDE } from './constants/css-property-keyword';

export class BreakInsideStyle extends Style {
    static override key = BREAK + DASH + INSIDE;
}