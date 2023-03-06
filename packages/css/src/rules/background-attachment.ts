import { Rule } from '../rule'

export class BackgroundAttachment extends Rule {
    static id = 'BackgroundAttachment' as const
    static matches = '^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)'
}