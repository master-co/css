import { dash, STYLE, TRANSFORM } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransformStyle extends Style {
    static override matches = /^transform:(flat|preserve-3d)(?!;)/;
    static override key = dash(TRANSFORM, STYLE);
}