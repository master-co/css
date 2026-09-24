'use client'

import { createContext } from 'react'
const RedirectsContext = createContext<any>(null)

export const RedirectsProvider = (props: any) => {
  return <RedirectsContext.Provider {...props} />
}

export default RedirectsContext