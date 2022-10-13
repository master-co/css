import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridAutoColumns'
    static override matches = /^grid-auto-cols:./;
    static override propName = 'grid-auto-columns';
}