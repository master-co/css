import DocumentCopyButton from './DocumentCopyButton'

export interface DocumentPromptProps {
  title: string
  text: string
}

/** Readable prose preserves its exact clipboard text while wrapping within the document. */
export default function DocumentPrompt({ title, text }: DocumentPromptProps) {
  return <figure className="ui-prompt" aria-label={title}>
    <figcaption className="ui-code-bar"><span className="ui-code-file">{title}</span><DocumentCopyButton text={text} label={title} /></figcaption>
    <p className="ui-prompt-body">{text}</p>
  </figure>
}
