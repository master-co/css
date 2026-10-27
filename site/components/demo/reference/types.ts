export interface ReferenceDemoSection {
  page: string
  id: string
  title: string
  html: string[]
  css: string
  classes: string[]
  classLists: string[]
  highlighted: string[]
}

export interface DemoScene {
  html: string
  /** Trusted resources and body classes from authored whole-document examples. */
  head?: string
  bodyClass?: string
  caption: string
  height?: number
  maxWidth?: number
  sizing?: 'viewport' | 'content'
  inspect?: string[]
  motion?: boolean
  theme?: boolean
  responsive?: boolean
  css?: string
}

export type SceneFactory = (section: ReferenceDemoSection) => DemoScene
