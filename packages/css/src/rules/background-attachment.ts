import { Rule } from '../rule'

export class BackgroundAttachment extends Rule {
    static override id = 'BackgroundAttachment' as const
    static override matches = '^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)'
}