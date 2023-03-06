import { Rule } from '../rule'

export class BackgroundSize extends Rule {
    static id = 'BackgroundSize' as const
    static matches = '^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)'
}