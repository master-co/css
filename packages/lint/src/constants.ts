export const defaultClassLintSettings = {
    classAttributes: ['class', 'className'] as string[],
    classFunctions: ['clsx', 'cva', 'ctl', 'cv', 'class', 'classnames', 'classVariant', 'styled(?:\\s+)?(?:\\.\\w+)?', 'classList(?:\\s+)?\\.(?:add|remove|toggle|replace)'] as string[],
    classDeclarations: [] as string[],
    ignoredKeys: ['compoundVariants', 'defaultVariants'] as string[]
}
