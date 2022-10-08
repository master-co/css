import { MasterCSSRule } from '../rule';

export class Inset extends MasterCSSRule {
    static override matches = /^(?:top|bottom|left|right):./;
    static override propName = 'inset';
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
}