import clsx from 'clsx'
import Footer from './Footer'
import type { FooterProps } from './Footer'

export default function DocMain({ footerProps, ...props }: any & { footerProps?: FooterProps }) {
  return (
    <main {...props} className={clsx('flex flex-col w:100% min-w:0', props.className)}>
      <div className='flex flex-nowrap justify-center w:100% max-w:var(--breakpoint-lg) mx:auto'>
        {props.children}
      </div>
      {footerProps && <Footer {...footerProps} className={clsx('pl:5rem@sm', footerProps.className)} />}
    </main>
  )
}
