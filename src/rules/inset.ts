import { MasterCSSRule } from '../rule';

export class Inset extends MasterCSSRule {
    static override matches = /^(?:top|bottom|left|right):./;
    static override propName = 'inset';
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: propertyInfo
        }
    }
}