import '~/site/styles/blog-materials.css'
import Image from '~/site/docs-shell/components/Image'
import authors from '~/site/docs-shell/data/authors'

/** Overlapping portraits and the names they belong to; portraits are decorative beside the names. */
export default function BlogAuthors({ names, className }: { names: { name: string }[], className?: string }) {
  const known = names.flatMap(({ name }) => authors.find((author) => author.name === name) ?? [])
  return (
    <span className={['blog-authors', className].filter(Boolean).join(' ')}>
      <span className="blog-avatar-stack" aria-hidden="true">
        {known.map((author, index) => (
          <span key={author.name} className="blog-avatar" style={{ zIndex: known.length - index }}>
            <Image src={author.image} width={24} height={24} alt="" />
          </span>
        ))}
      </span>
      <span className="blog-author-names">{names.map(({ name }) => name).join(' · ')}</span>
    </span>
  )
}
