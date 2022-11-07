import Rule from '../rule'

export default class extends Rule {
    static override id = 'BackgroundImage'
    static override matches = /^(bg|background):(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!\|).)*$/
    static override colorful = true
}