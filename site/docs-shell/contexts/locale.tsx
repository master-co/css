import { useContext } from 'react'
import { sharedContext } from '~/site/islands/context'

const LocaleContext = sharedContext<any>('locale', null)

export const LocaleProvider = (props: any) => {
  return <LocaleContext.Provider {...props} />
}

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error(`useLocale must be used within a LocaleProvider`)
  }
  return context
}

export default LocaleContext