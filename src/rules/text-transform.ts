import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextTransform'
    static override matches = /^t(ext)?:(uppercase|lowercase|capitalize)(?!\|)/;
    static override propName = 'text-transform'
}