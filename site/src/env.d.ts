/// <reference types="astro/client" />
/// <reference types="@master/css/client" />

interface ImportMetaEnv {
  readonly PUBLIC_PROJECT: string
  readonly PUBLIC_HOST: string
  readonly PUBLIC_URL: string
  readonly PUBLIC_VERSION: string
  readonly PUBLIC_REPO_OWNER: string
  readonly PUBLIC_REPO_SLUG: string
  readonly PUBLIC_COMMIT_REF: string
  readonly PUBLIC_IMAGE_TRANSFORMATIONS: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// TypeScript modules import components; the Astro and Svelte compilers type-check their own sources.
declare module '*.astro' {
  const Component: import('astro/runtime/server/index.js').AstroComponentFactory
  export default Component
}

declare module '*.svelte' {
  const Component: import('svelte').Component<any>
  export default Component
}

declare module '*.mdx' {
  const Content: import('astro/runtime/server/index.js').AstroComponentFactory
  export default Content
  export const toc: { id: string, title: string, level: number }[] | undefined
  export const components: Record<string, unknown>
}
