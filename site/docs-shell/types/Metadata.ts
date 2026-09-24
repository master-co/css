import { Metadata as NextMetadata } from 'next'

export declare type Metadata = NextMetadata & {
  fileURL: string
  [key: string]: any
}

export declare type DefinedMetadata = Metadata & { pathname: string }