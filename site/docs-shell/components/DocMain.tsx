import clsx from 'clsx'
import Footer from './Footer'
import type { FooterProps } from './Footer'

export default function DocMain({ footerProps, ...props }: any & { footerProps?: FooterProps }) {
  return (
    <main {...props} className={clsx('display:flex flex-direction:column width:100% min-width:0', props.className)}>
      <div className='display:flex flex-wrap:nowrap justify-content:center width:100% max-width:80rem margin-inline:auto'>
        {props.children}
      </div>
      {footerProps && <Footer {...footerProps} className={clsx('padding-left:5rem@sm', footerProps.className)} />}
    </main>
  )
}
