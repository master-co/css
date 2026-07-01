import type { FooterLink, FooterNavGroup, FooterProps } from 'internal/components/Footer'
import type { AppNavItem } from 'internal/contexts/app'
import { IconBrandDiscord, IconBrandGithub, IconBrandX, IconCompass, IconFileText, IconMessages, IconSourceCode, IconWriting } from '@tabler/icons-react'

const repoSlug = process.env.NEXT_PUBLIC_REPO_SLUG || 'css'
const repositoryURL = `https://github.com/master-co/${repoSlug}`
const discussionsURL = `${repositoryURL}/discussions`

export const primaryNavs = [
    { name: 'Guide', href: '/guide', Icon: IconCompass },
    { name: 'Reference', fullName: 'API Reference', href: '/reference', Icon: IconFileText },
    { name: 'Blog', href: '/blog', Icon: IconWriting },
    { name: 'Play', href: '/play', Icon: IconSourceCode },
] satisfies AppNavItem[]

export const communityNavs = [
    { name: 'GitHub', href: repositoryURL, Icon: IconBrandGithub },
    { name: 'Discussions', href: discussionsURL, Icon: IconMessages },
    { name: 'Discord', href: 'https://discord.com/invite/sZNKpAAAw6', Icon: IconBrandDiscord },
    { name: 'X', href: 'https://twitter.com/mastercorg', Icon: IconBrandX },
] satisfies AppNavItem[]

export const footerLegalLinks = [
    { name: 'MIT License', href: `${repositoryURL}?tab=MIT-1-ov-file#readme` },
    { name: 'Trademark Policy', href: '/brand#trademark-policy' },
] satisfies (FooterLink & { href: string })[]

export const footerNavGroups = [
    {
        name: 'Docs',
        links: [
            { name: 'Guide', href: '/guide' },
            { name: 'Getting Started', href: '/guide/introduction' },
            { name: 'Installation', href: '/guide/installation' },
            { name: 'API Reference', href: '/reference' },
        ]
    },
    {
        name: 'Resources',
        links: [
            { name: 'Play', href: '/play' },
            { name: 'Blog', href: '/blog' },
            { name: 'Console Messages', href: '/messages' },
            { name: 'Design System', href: '/design-system' },
        ]
    },
    {
        name: 'Community',
        links: communityNavs.map(({ name, href }) => ({ name, href }))
    },
    {
        name: 'More',
        links: [
            { name: 'Sponsor', href: '/sponsor' },
            { name: 'Brand', href: '/brand' },
            ...footerLegalLinks,
        ]
    },
] satisfies FooterNavGroup[]

export const footerProps = {
    navGroups: footerNavGroups,
    legalLinks: footerLegalLinks,
} satisfies Pick<FooterProps, 'navGroups' | 'legalLinks'>
