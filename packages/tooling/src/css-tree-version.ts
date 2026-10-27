import * as cssTree from '@eslint/css-tree'

// The package exports version at runtime, but omits it from its type declarations.
export const cssTreeVersion = (cssTree as typeof cssTree & { version: string }).version
