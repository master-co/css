import nextMDX from '@next/mdx'

const withMDX = nextMDX({
  extension: /\.(md|mdx)$/,
  options: {
    // If you use remark-gfm, you'll need to use next.config.js
    // as the package is ESM only
    // https://github.com/remarkjs/remark-gfm#install
    remarkPlugins: [
      [new URL('../remark/auto-imports.js', import.meta.url).pathname],
      [new URL('../remark/slug-and-toc.js', import.meta.url).pathname],
      ['remark-gfm'],
      [new URL('../remark/code-meta.js', import.meta.url).pathname],
    ],
    // rehypePlugins: [
    //     ['rehype-slug'],
    // ],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
})

export default withMDX