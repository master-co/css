/// <reference types="vite/types/import-meta.d.ts" />
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

// Site conventions differ from `astro/client`: see astro/svg-components.ts.
declare module '*.svg' {
  const Component: import('react').FunctionComponent<import('react').SVGProps<SVGSVGElement>>
  export default Component
}

declare module '*.png' {
  const image: import('../docs-shell/components/Image').StaticImage
  export default image
}

declare module '*.jpg' {
  const image: import('../docs-shell/components/Image').StaticImage
  export default image
}

declare module '*.jpeg' {
  const image: import('../docs-shell/components/Image').StaticImage
  export default image
}

declare module '*.webp' {
  const image: import('../docs-shell/components/Image').StaticImage
  export default image
}

declare module '*?raw' {
  const source: string
  export default source
}

declare module 'virtual:site-islands' {
  const modules: Record<string, () => Promise<Record<string, unknown>>>
  export default modules
}
