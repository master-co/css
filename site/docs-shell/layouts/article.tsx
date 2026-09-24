import Footer from '../components/Footer'
import HeroHeader from '../components/HeroHeader'
import clsx from 'clsx'
import type { FooterProps } from '../components/Footer'

export default async function Layout({ footerProps, ...props }: any & { footerProps?: FooterProps }) {
  return <>
    <HeroHeader metadata={props.metadata} />
    <main className='mx:auto px:5x pt:15x w:full@print max-w:none@print p:15x|1.875rem@print px:xl@md'>
      <article className="max-w:674px mx:auto mb:20x mt:0>:first prose">
        {props.children}
      </article>
    </main>
    {footerProps && <Footer {...footerProps} className={clsx('app-wrapper', footerProps.className)} />}
  </>


}
