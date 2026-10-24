import '~/site/styles/globals.css'
import type { ReactNode } from 'react'

/** Example pages render inside documentation iframes without the site shell. */
export const bare = true

export default function ExampleSection({ children }: { children: ReactNode }) {
  return <>{children}</>
}
