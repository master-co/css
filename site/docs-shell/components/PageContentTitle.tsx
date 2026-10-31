/**
 * A contents entry's words: a title written as `code` is set in the mono face, any other title is translated. The
 * heading's text runs are joined with spaces when the contents are collected, so a space before punctuation that
 * followed inline code (`:hover`, `:active`) is taken out again.
 */
export default function PageContentTitle({ title, translate }: { title: string, translate?: (text: string) => string }) {
  if (title.startsWith('`')) return <code>{title.replace(/`/g, '')}</code>
  const text = translate ? translate(title) : title
  return <>{text.replace(/\s+([,.;:!?)])/g, '$1').replace(/\(\s+/g, '(')}</>
}
