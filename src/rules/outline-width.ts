import { dash, OUTLINE, WIDTH } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class OutlineWidth extends MasterCSSRule {
    static override matches = /^outline:(medium|thick|thin|[0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/;
    static override propName = dash(OUTLINE, WIDTH);
}