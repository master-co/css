import { Fragment } from 'react'

/** Prefer identifier boundaries without inserting characters into copied text. */
export default function DocumentIdentifier({ children }: { children: string }) {
  const parts = children.split(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|(?<=[/_-])/)
  return parts.map((part, index) => <Fragment key={index}>{index > 0 && <wbr />}{part}</Fragment>)
}
