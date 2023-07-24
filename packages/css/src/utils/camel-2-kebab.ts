export function camel2Kebab(camel: string) {
    return camel.replace(/(^|[a-z0-9]+)([A-Z])/g, '$1-$2').toLowerCase()
}