import { CLEAR } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Clear'
    static override propName = CLEAR;
}