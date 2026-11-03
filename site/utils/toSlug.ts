export function toSlug(str: string) {
    return str.toLowerCase().replace(/ /g, '-')
}