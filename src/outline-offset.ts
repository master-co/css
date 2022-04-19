import { dash, OFFSET, OUTLINE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class OutlineOffset extends Style {
    static override key = dash(OUTLINE, OFFSET);
}