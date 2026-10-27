export default function resolveHeading(title, id) {
  const explicit = typeof title === 'string' && title.match(/\s+\{#([\w-]+)\}$/)
  if (explicit) {
    title = title.slice(0, explicit.index)
    id = explicit[1]
  }
  const words = title?.split?.(' ')

  if (words?.pop() === '[sr-only]') {
    return {
      title: words.join(' '),
      id: id
        ?.replace('-sr-only', '')
        ?.replace('-[sr-only]', ''),
      className: 'sr-only'
    }
  }
  return { title, id }
}
