import { MasterCSSRule } from '../rule';
import { SQUARE, VIDEO, ASPECT, RATIO, dash } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'AspectRadio'
    static override matches = /^aspect:./;
    static override propName = dash(ASPECT, RATIO);
    static override unit = '';
}