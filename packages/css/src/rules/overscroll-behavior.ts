import { Rule } from '../rule'

export class OverscrollBehavior extends Rule {
    static id = 'OverscrollBehavior' as const
    static matches = '^overscroll-behavior(?:-[xy])?:'
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        switch (this.prefix.slice(-2, -1)) {
        case 'x':
            return { 'overscroll-behavior-x': declaration }
        case 'y':
            return { 'overscroll-behavior-y': declaration }
        default:
            return { 'overscroll-behavior': declaration }
        }
    }
}