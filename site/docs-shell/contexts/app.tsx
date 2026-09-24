'use client'

import { createContext, useContext } from 'react'
import type { ComponentType, FunctionComponent, SVGProps } from 'react'

export declare interface AppNavItem {
  name: string
  href?: string
  fullName?: string
  date?: string
  disabled?: boolean
  Icon?: ComponentType<any>
}

export declare interface App {
  Logotype: FunctionComponent<SVGProps<SVGSVGElement>>
  navs: AppNavItem[]
  communityNavs?: AppNavItem[]
  versions: { name: string, href: string }[]
}

const AppContext = createContext<App | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error(`useLocale must be used within a LocaleProvider`)
  }
  return context
}

export const AppProvider = (props: any) => {
  return <AppContext.Provider {...props} />
}

export default AppContext
