import type { Component } from 'svelte'
import Logotype from '~/site/docs-shell/components/CSSLogotype.svelte'
import { communityNavs, primaryNavs } from '~/site/navigation'

export declare interface AppNavItem {
  name: string
  href?: string
  fullName?: string
  date?: string
  disabled?: boolean
  Icon?: Component<any>
}

export declare interface App {
  Logotype: Component<any>
  navs: AppNavItem[]
  communityNavs?: AppNavItem[]
  versions: { name: string, href: string }[]
}

export default {
  navs: primaryNavs,
  communityNavs,
  versions: [
    { name: 'v1.37.3', href: 'https://css.master.co' }
  ],
  Logotype
} as App
