import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'MinHeight'
    static override matches = /^min-h:./;
    static override propName = 'min-height';
}