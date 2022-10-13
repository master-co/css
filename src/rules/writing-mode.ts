import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'WritingMode'
    static override matches = /^writing:./;
    static override propName = 'writing-mode'
}