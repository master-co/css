import { MasterCSSRule } from '../rule';
import { BACKGROUND, dash, SIZE } from '../constants/css-property-keyword';

export class BackgroundSize extends MasterCSSRule {
    static override matches = /^(bg|background):((auto|cover|contain)(?!\|)|\.?\d((?!\|).)*$)/;
    static override propName = dash(BACKGROUND, SIZE);
}