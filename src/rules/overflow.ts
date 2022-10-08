import { X, Y } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Overflow extends MasterCSSRule {
    static id = 'overflow';
    static override matches = /^overflow(-x|-y)?:(?:visible|overlay|hidden|scroll|auto|clip|inherit|initial|revert|revert-layer|unset|\$|var)/;
    override get(declaration): { [key: string]: any } {
        if (this.prefix) {
            switch (this.prefix.slice(-2, -1)) {
                case X:
                    return { 'overflow-x': declaration };
                case Y:
                    return { 'overflow-y': declaration };
            }
        }
        return { 'overflow': declaration };
    }
    override get order(): number {
        if (this.prefix) {
            switch (this.prefix.slice(-2, -1)) {
                case X:
                case Y:
                    return 0;
            }
        }
        return -1;
    }
}