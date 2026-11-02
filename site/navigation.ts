import type { AppNavItem } from '~/site/app-config'
import IconBrandDiscord from '@tabler/icons-svelte-runes/icons/brand-discord'
import IconBrandGithub from '@tabler/icons-svelte-runes/icons/brand-github'
import IconBrandX from '@tabler/icons-svelte-runes/icons/brand-x'
import IconCompass from '@tabler/icons-svelte-runes/icons/compass'
import IconFileText from '@tabler/icons-svelte-runes/icons/file-text'
import IconMessages from '@tabler/icons-svelte-runes/icons/messages'
import IconWriting from '@tabler/icons-svelte-runes/icons/writing'

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
  { name: 'Blog', href: '/blog', Icon: IconWriting },
] satisfies AppNavItem[]

export const communityNavs = [
  { name: 'GitHub', href: repositoryURL, Icon: IconBrandGithub },
  { name: 'Discussions', href: discussionsURL, Icon: IconMessages },
  { name: 'Discord', href: 'https://discord.com/invite/sZNKpAAAw6', Icon: IconBrandDiscord },
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
      { name: 'Blog', href: '/blog' },
      { name: 'Design System', href: '/design-system' },
      { name: 'Brand', href: '/brand' },
    ]
  },
  {
    name: 'Community',
    links: communityNavs.map(({ name, href }) => ({ name, href }))
  },
  {
    name: 'Legal',
    links: [
      { name: 'MIT License', href: `${repositoryURL}?tab=MIT-1-ov-file#readme` },
      { name: 'Trademark Policy', href: '/brand#trademark-policy' },
    ]
  },
] satisfies FooterNavGroup[]

export const footerProps = {
  navGroups: footerNavGroups,
} satisfies { navGroups: FooterNavGroup[] }
