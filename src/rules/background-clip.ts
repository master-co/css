import Rule from '../rule'

export default class extends Rule {
    static override id: 'BackgroundClip' = 'BackgroundClip' as const
    static override matches = /^(bg|background):text(?!\|)/
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-background-clip': declaration,
            'background-clip': declaration
        }
    }
}