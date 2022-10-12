import { MasterCSSRule } from '../rule';
import { BORDER, dash, IMAGE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BorderImageOutset'
    static override propName = dash(BORDER, IMAGE, 'outset');
}