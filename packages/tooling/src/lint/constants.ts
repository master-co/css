export const defaultClassLintSettings = Object.freeze({
  classAttributes: Object.freeze(['class', 'className']),
  classFunctions: Object.freeze([
    'clsx',
    'cva',
    'ctl',
    'cv',
    'class',
    'classnames',
    'classVariant',
    'styled(?:\\s+)?(?:\\.\\w+)?',
    'classList(?:\\s+)?\\.(?:add|remove|toggle|replace)'
  ]),
  classDeclarations: Object.freeze([] as string[]),
  ignoredKeys: Object.freeze(['compoundVariants', 'defaultVariants'])
})
