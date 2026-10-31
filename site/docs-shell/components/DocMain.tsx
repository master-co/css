import clsx from 'clsx'
import '~/site/styles/docs-shell/docs.css'
import Footer from './Footer'
import type { FooterProps } from './Footer'

export default function DocMain({ footerProps, ...props }: any & { footerProps?: FooterProps }) {
  return (
    <main {...props} className={clsx('flex flex-col w-full min-w(0) doc-main', props.className)}>
      <div className='flex flex-nowrap justify-center w-full (max-width:80rem) mx-auto'>
        {props.children}
      </div>
      {footerProps && <Footer {...footerProps} className={clsx('(padding-left:5rem)@sm doc-footer', footerProps.className)} />}
    </main>
  )
}
