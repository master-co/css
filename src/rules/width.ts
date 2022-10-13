import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Width'
    static override matches = /^w:./;
    static override propName = 'width'
}