import { MasterCSSRule } from '../rule';
import { BORDER, dash, IMAGE } from '../constants/css-property-keyword';

export class BorderImageOutset extends MasterCSSRule {
    static override key = dash(BORDER, IMAGE, 'outset');
}