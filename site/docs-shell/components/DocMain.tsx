import clsx from 'clsx'
import '~/site/styles/docs-shell/docs.css'
import Footer from './Footer'
import type { FooterProps } from './Footer'

/** The main column: the article and its contents rail, then the footer. */
export default function DocMain({ footerProps, className, children, ...props }: any & { footerProps?: FooterProps }) {
  return (
    <main {...props} className={clsx('ui-docs-main', className)}>
      <div className="ui-docs-body">
        {children}
      </div>
      {footerProps && <Footer {...footerProps} />}
    </main>
  )
}
