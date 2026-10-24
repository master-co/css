import type { ReactNode } from 'react'
import SearchDialog from '~/site/docs-shell/contexts/search'

/** Every documentation page owns one search dialog. */
export default function DocumentShell({ children }: { children: ReactNode }) {
  return <>
    {children}
    <SearchDialog />
  </>
}
