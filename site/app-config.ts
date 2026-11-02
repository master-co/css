import type { Component } from 'svelte'
import Logotype from '~/site/components/CSSLogotype.svelte'
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
  name: string
  brandURL: string
  Logotype: Component<any>
  navs: AppNavItem[]
  communityNavs?: AppNavItem[]
  versions: { name: string, href: string }[]
}

export default {
  name: 'Master CSS',
  brandURL: 'https://master.co/brand/master-css',
  sourceBaseURL: 'https://github.com/master-co/css/blob/rc/',
  feedbackURL: 'https://github.com/master-co/css/issues/new?template=docs_request.yml',
  navs: primaryNavs,
  communityNavs,
  versions: [
    { name: 'v1.37.3', href: 'https://css.master.co' }
  ],
  Logotype
} as App
