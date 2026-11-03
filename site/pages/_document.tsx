import Docuemnt, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import { render } from '@master/css/render';
import { StyleSheet } from '@master/css';
import i18nextConfig from '../next-i18next.config';
// eslint-disable-next-line @next/next/no-script-in-document
import Script from 'next/script';

export default function MyDocument(props: any) {
    const currentLocale = props.__NEXT_DATA__.query.locale || i18nextConfig.i18n.defaultLocale;
    return (
        <Html className={props.htmlClassName} lang={currentLocale}>
            <Head>
                <Script id="init-script" strategy='beforeInteractive'
                    dangerouslySetInnerHTML={{
                        __html: `
                        window.history.scrollRestoration = 'auto';
                        window.MasterCSSManual = true;
                        document.documentElement.classList.add(localStorage.getItem("theme") || "dark");
                `}} />
                <Script async src="https://www.googletagmanager.com/gtag/js?id=G-0BM1BSHN1C" strategy="lazyOnload" />
                <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-0BM1BSHN1C');
                    `}}>
                </Script>
            </Head>
            <body className={props.bodyClassName}>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
    let page: any;

    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = () =>
        originalRenderPage({
            enhanceComponent: (Component) => {
                if ('page' in Component) {
                    page = Component['page'];
                }
                return Component;
            },
        });
    const initialProps = await Docuemnt.getInitialProps(ctx);

    let htmlClassName = 'overflow-x:hidden';
    let bodyClassName = 'f:fade-20 f:gray-80@dark bg:fade-50/.2_:where(::selection) overflow-x:hidden';

    let noBackground = false;
    if (page) {
        if (page.bodyClassName) {
            bodyClassName += ' ' + page.bodyClassName;
        }
        if (page.noBackground) {
            noBackground = true;
        }
        if (page.htmlClassName) {
            htmlClassName += ' ' + page.htmlClassName;
        }
    }
    if (!noBackground) {
        bodyClassName += ' ' + 'bg:white@light bg:gray-16@dark';
    }

    const { css } = render(initialProps.html + `<p class="${htmlClassName} ${bodyClassName}">`, { StyleSheet });
    return {
        ...initialProps,
        styles: (
            <>
                <style id="master-css">{css}</style>
                {initialProps.styles}
            </>
        ),
        htmlClassName,
        bodyClassName
    }
}