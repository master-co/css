import Rule from '../rule'

export default class extends Rule {
    static override id: 'Overflow' = 'Overflow' as const
    static override matches = /^overflow(-x|-y)?:(?:visible|overlay|hidden|scroll|auto|clip|inherit|initial|revert|revert-layer|unset|\$|var)/
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        if (this.prefix) {
            switch (this.prefix.slice(-2, -1)) {
            case 'x':
                return { 'overflow-x': declaration }
            case 'y':
                return { 'overflow-y': declaration }
            }
        }
        return { 'overflow': declaration }
    }
    override get order(): number {
        if (this.prefix) {
            switch (this.prefix.slice(-2, -1)) {
            case 'x':
            case 'y':
                return 0
            }
        }
        return -1
    }
}