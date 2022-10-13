import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'BackgroundSize'
    static override matches = /^(bg|background):((auto|cover|contain)(?!\|)|\.?\d((?!\|).)*$)/;
    static override propName = 'background-size';
}