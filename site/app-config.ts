import type { SiteApp } from '@master/internal-site/config'
import Logotype from '~/site/components/CSSLogotype.svelte'
import { communityNavs, primaryNavs } from '~/site/navigation'
import { readPublicEnv } from './utils/public-env.js'

const { PUBLIC_VERSION } = readPublicEnv()

export type { AppNavItem } from '@master/internal-site/config'

export default {
  name: 'Master CSS',
  brandURL: 'https://master.co/brand/master-css',
  sourceBaseURL: `https://github.com/master-co/css/blob/v${PUBLIC_VERSION}/`,
  feedbackURL: 'https://github.com/master-co/css/issues/new?template=docs_request.yml',
  navs: primaryNavs,
  communityNavs,
  header: {
    communityNavs: communityNavs.filter(({ name }) => name === 'Discussions' || name === 'GitHub'),
    searchOnHome: true
  },
  versions: [
    { name: 'v1.37.8', href: 'https://v1.css.master.co' }
  ],
  Logotype
} satisfies SiteApp
