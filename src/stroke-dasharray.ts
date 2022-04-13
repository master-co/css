import { DASH, STROKE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class StrokeDasharrayStyle extends Style {
    static override key = STROKE + DASH + 'dasharray';
}