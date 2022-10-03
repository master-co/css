import { MasterCSSRule } from '../rule';

export class Inset extends MasterCSSRule {
    static override matches = /^(?:top|bottom|left|right):./;
    static override key = 'inset';
    override get props(): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: this
        }
    }
}