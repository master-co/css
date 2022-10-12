import { MasterCSSRule } from '../rule';
import { BORDER, dash, IMAGE, SLICE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BorderImageSlice'
    static override propName = dash(BORDER, IMAGE, SLICE);
    static override unit = '';
}