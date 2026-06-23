import path from 'node:path'

export default function isSameOrChildPath(parentPath: string, childPath: string) {
    const relativePath = path.relative(parentPath, childPath)
    return relativePath === ''
        || (
            !!relativePath
            && relativePath !== '..'
            && !relativePath.startsWith(`..${path.sep}`)
            && !path.isAbsolute(relativePath)
        )
}
