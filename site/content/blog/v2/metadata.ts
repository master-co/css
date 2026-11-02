import define from '~/site/docs-shell/utils/metadata'

const description = 'From your first idea to a design system of your own. Introducing expressive CSS, flexible rendering, and tools that understand your project.'

export default define({
  title: 'Master CSS 2.0',
  description,
  category: 'Release',
  authors: [{ name: 'Aron' }, { name: 'BenSeage' }, { name: 'Miles' }, { name: 'Lola' }, { name: 'Joy' }],
  // Add the actual publication date when scheduling the release.
  openGraph: { title: 'Master CSS 2.0', description, images: '/images/blog/v2/social.png' },
  twitter: { card: 'summary_large_image', title: 'Master CSS 2.0', description, images: '/images/blog/v2/social.png' },
  fileURL: import.meta.url
})
