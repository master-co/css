import { MasterCSSRule } from '../rule';
import { BORDER, dash, IMAGE } from '../constants/css-property-keyword';

export class BorderImageOutset extends MasterCSSRule {
    static override propName = dash(BORDER, IMAGE, 'outset');
}