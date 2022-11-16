import Rule from '../rule'

export default class extends Rule {
    static override id: 'BackgroundRepeat' = 'BackgroundRepeat' as const
    static override matches = /^(bg|background):(space|round|repeat|no-repeat|repeat-x|repeat-y)(?![;a-zA-Z])/
}