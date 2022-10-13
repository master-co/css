import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'OverscrollBehavior'
    static override matches = /^overscroll-behavior(?:-[xy])?:/;
    override get(declaration): { [key: string]: any } {
        switch (this.prefix.slice(-2, -1)) {
            case 'x':
                return { 'overscroll-behavior-x': declaration };
            case 'y':
                return { 'overscroll-behavior-y': declaration };
            default:
                return { 'overscroll-behavior': declaration };
        }
    }
}