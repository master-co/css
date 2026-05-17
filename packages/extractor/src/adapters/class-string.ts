import extractLatentClasses from '../functions/extract-latent-classes'

export function addClassString(
    classes: Set<string>,
    value: string | undefined | null,
    cache?: Map<string, string[]>
) {
    if (!value) return
    let classNames = cache?.get(value)
    if (!classNames) {
        classNames = extractLatentClasses(value)
        cache?.set(value, classNames)
    }
    for (const className of classNames) {
        if (className) classes.add(className)
    }
}
