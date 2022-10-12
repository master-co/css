import { MasterCSSRule } from '../rule';
import { BACKGROUND, dash, SIZE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BackgroundSize'
    static override matches = /^(bg|background):((auto|cover|contain)(?!\|)|\.?\d((?!\|).)*$)/;
    static override propName = dash(BACKGROUND, SIZE);
}