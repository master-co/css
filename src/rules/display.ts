import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Display'
    static override matches = /^d:./;
    static override propName = 'display';
}