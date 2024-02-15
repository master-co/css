export type Options = {
    override: boolean
    ext: 'mjs' | 'ts' | 'js'
    pm: 'npm' | 'yarn' | 'pnpm' | 'bun'
    example: string
}