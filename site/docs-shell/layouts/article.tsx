import Footer from '../components/Footer'
import HeroHeader from '../components/HeroHeader'
import clsx from 'clsx'
import type { FooterProps } from '../components/Footer'

export default async function Layout({ footerProps, ...props }: any & { footerProps?: FooterProps }) {
  return <>
    <HeroHeader metadata={props.metadata} />
    <main className='margin-inline:auto padding-inline:1.25rem padding-top:3.75rem width:100%@media(print) max-width:none@media(print) padding-top:3.75rem@media(print) padding-right:1.875rem@media(print) padding-bottom:3.75rem@media(print) padding-left:1.875rem@media(print) px-xl@md'>
      <article className="max-width:674px margin-inline:auto margin-bottom:5rem margin-top:0>:first-child prose">
        {props.children}
      </article>
    </main>
    {footerProps && <Footer {...footerProps} className={clsx('app-wrapper', footerProps.className)} />}
  </>


}
