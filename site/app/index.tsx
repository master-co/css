'use client'

import type { App } from '~/site/docs-shell/contexts/app'
import Logotype from '~/site/docs-shell/components/CSSLogotype'
import { communityNavs, primaryNavs } from '~/site/navigation'

export default {
  navs: primaryNavs,
  communityNavs,
  versions: [
    { name: 'v1.37.3', href: 'https://css.master.co' }
  ],
  Logotype
} as App
