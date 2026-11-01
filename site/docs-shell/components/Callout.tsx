import { IconAlertTriangle, IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react'
import type { ReactNode } from 'react'

const icons = {
  info: IconInfoCircle,
  warning: IconAlertTriangle,
  do: IconCheck,
  dont: IconX
}

/** A `ui-callout`: one icon and one status tint around a short note. Markdown writes it as `(i)`, `(!)`, `(o)` or `(x)`. */
export default function Callout({ tone, children }: { tone: keyof typeof icons, children?: ReactNode }) {
  const Icon = icons[tone]
  return (
    <div className="ui-callout" data-tone={tone} role="note">
      <Icon aria-hidden="true" stroke={1.5} />
      <div><p>{children}</p></div>
    </div>
  )
}
