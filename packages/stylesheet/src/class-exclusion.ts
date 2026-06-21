export type ClassExcludePattern = string | RegExp

export interface ClassExclusionMatcher {
    exact: Set<string>
    patterns: RegExp[]
}

export function createClassExclusionMatcher(excludeClasses?: Iterable<ClassExcludePattern>): ClassExclusionMatcher {
    const exact = new Set<string>()
    const patterns: RegExp[] = []
    for (const excludedClass of excludeClasses || []) {
        if (typeof excludedClass === 'string') {
            exact.add(excludedClass)
        } else {
            patterns.push(excludedClass)
        }
    }
    return { exact, patterns }
}

export function isClassExcludedByMatcher(className: string, matcher: ClassExclusionMatcher) {
    if (matcher.exact.has(className)) return true
    for (const pattern of matcher.patterns) {
        pattern.lastIndex = 0
        const excluded = pattern.test(className)
        pattern.lastIndex = 0
        if (excluded) return true
    }
    return false
}

export function filterExcludedClasses(classes: string[], excludeClasses?: Iterable<ClassExcludePattern>) {
    const matcher = createClassExclusionMatcher(excludeClasses)
    if (!matcher.exact.size && !matcher.patterns.length) return classes
    return classes.filter((className) => !isClassExcludedByMatcher(className, matcher))
}
