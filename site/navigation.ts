import type { AppNavItem } from '~/site/app-config'
import IconBrandGithub from '@master/icons-svelte/native/20/soft/brand-github-outline'
import IconBrandX from '@master/icons-svelte/native/20/soft/brand-x'
import IconBug from '@master/icons-svelte/native/20/soft/bug'
import IconCompass from '@master/icons-svelte/native/20/soft/compass'
import IconFileText from '@master/icons-svelte/native/20/soft/file-text'
import IconMessages from '@master/icons-svelte/native/20/soft/messages'
import IconWriting from '@master/icons-svelte/native/20/soft/pencil'

export interface FooterNavGroup {
  name: string
  links: { name: string, href: string }[]
}

const repoSlug = import.meta.env?.PUBLIC_REPO_SLUG || 'css'
const repositoryURL = `https://github.com/master-co/${repoSlug}`
const discussionsURL = `${repositoryURL}/discussions`

export const primaryNavs = [
  { name: 'Guide', href: '/guide', Icon: IconCompass },
  { name: 'Reference', fullName: 'Reference', href: '/reference', Icon: IconFileText },
  { name: 'Blog', href: 'https://master.co/blog', Icon: IconWriting },
] satisfies AppNavItem[]

export const communityNavs = [
  { name: 'Discussions', href: discussionsURL, Icon: IconMessages },
  { name: 'Issues', href: `${repositoryURL}/issues`, Icon: IconBug },
  { name: 'GitHub', href: repositoryURL, Icon: IconBrandGithub },
  { name: 'X', href: 'https://twitter.com/mastercorg', Icon: IconBrandX },
] satisfies AppNavItem[]

export const footerNavGroups = [
  {
    name: 'Docs',
    links: [
      { name: 'Guide', href: '/guide' },
      { name: 'Getting Started', href: '/guide/introduction' },
      { name: 'Installation', href: '/guide/installation' },
      { name: 'Reference', href: '/reference' },
    ]
  },
  {
    name: 'Resources',
    links: [
      { name: 'Blog', href: 'https://master.co/blog' },
      { name: 'Brand', href: 'https://master.co/brand/master-css' },
    ]
  },
  {
    name: 'Community',
    links: [
      ...communityNavs.map(({ name, href }) => ({ name, href })),
      { name: 'Releases', href: `${repositoryURL}/releases` },
      { name: 'Discord', href: 'https://discord.com/invite/sZNKpAAAw6' },
    ]
  },
  {
    name: 'Legal',
    links: [
      { name: 'Licensing', href: `${repositoryURL}#license` },
      { name: 'Trademark Policy', href: 'https://master.co/brand/master-css#trademark-policy' },
    ]
  },
] satisfies FooterNavGroup[]

export const footerProps = {
  navGroups: footerNavGroups,
} satisfies { navGroups: FooterNavGroup[] }
