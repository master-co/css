import clsx from 'clsx'
import Footer from './Footer'
import type { FooterProps } from './Footer'

export default function DocMain({ footerProps, ...props }: any & { footerProps?: FooterProps }) {
  return (
    <main {...props} className={clsx('flex flex-col w:full min-w:0', props.className)}>
      <div className='flex flex-nowrap justify-center w:full max-w:breakpoint-lg mx:auto'>
        {props.children}
      </div>
      {footerProps && <Footer {...footerProps} className={clsx('pl:20x@sm', footerProps.className)} />}
    </main>
  )
}
