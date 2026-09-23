import DocumentCopyButton from './DocumentCopyButton'

export interface DocumentPromptProps {
  title: string
  text: string
}

/** Readable prose preserves its exact clipboard text while wrapping within the document. */
export default function DocumentPrompt({ title, text }: DocumentPromptProps) {
  return <figure className="doc-prompt" aria-label={title}>
    <figcaption><span>{title}</span><DocumentCopyButton text={text} label={title} /></figcaption>
    <pre>{text}</pre>
  </figure>
}
