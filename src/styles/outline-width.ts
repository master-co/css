import { dash, OUTLINE, WIDTH } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class OutlineWidth extends Style {
    static override matches = /^outline:([0-9]|(max|min|calc|clamp)\(.*\))((?!;).)*$/;
    static override key = dash(OUTLINE, WIDTH);
}