export declare type MetadataTitle = string | { absolute: string } | { default: string, template?: string }

/** Page metadata in the shape `docs-shell/utils/head` renders. */
export declare type Metadata = {
  title?: MetadataTitle
  description?: string
  category?: string
  robots?: string | { index?: boolean, follow?: boolean }
  alternates?: { canonical?: string }
  openGraph?: { title?: string, description?: string, siteName?: string, images?: string | string[] }
  twitter?: { card?: string, site?: string, creator?: string, title?: string, description?: string, images?: string | string[] }
  fileURL: string
  [key: string]: any
}

export declare type DefinedMetadata = Metadata & { pathname: string }
