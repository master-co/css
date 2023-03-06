import { Rule } from '../rule'

export class BackgroundSize extends Rule {
    static override id = 'BackgroundSize' as const
    static override matches = '^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)'
}