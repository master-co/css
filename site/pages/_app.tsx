import '../styles/globals.scss'
import '../styles/master.css'
// import 'default-passive-events';
import { appWithTranslation } from 'next-i18next';
import { isBrowser } from '~/utils/isBrowser';
import Head from 'next/head';
import Script from 'next/script';

if (isBrowser) {
    const htmlClassList = document.documentElement.classList
    window.addEventListener('storage', ({ key, newValue }) => {
        if (key === 'theme') {
            const isDark = newValue === 'dark';
            htmlClassList.toggle('dark', isDark);
            htmlClassList.toggle('light', !isDark);
        }
    })
}

function MyApp({ Component, pageProps }: any) {
    const page = Component.page;
    if (page?.layout) {
        const i18nNamespaces = pageProps._nextI18Next?.initialI18nStore[pageProps._nextI18Next.initialLocale];
        const getT = (namespace: string) => {
            const i18n = i18nNamespaces?.[namespace] ?? {};
            return (key: string, config?: Record<string, any>) => key in i18n ? i18n[key] : (config?.defaultValue ?? key);
        };

        const t = getT(page.localeNamespace);
        const { layout: Layout, prevNav, nextNav, sections } = page;
        const Container = Layout.Container;
        const layoutProps = Object.assign({}, Layout.getProps?.(page), page, { t });
        if (prevNav) {
            prevNav.t = getT(prevNav?.locale ?? '');
        }
        if (nextNav) {
            nextNav.t = getT(nextNav?.locale ?? '');
        }

        return (
            <Container {...layoutProps} sections={sections} prevNav={prevNav} nextNav={nextNav}>
                <Layout {...layoutProps}>
                    <Component {...pageProps} t={t} />
                </Layout>
            </Container>
        )
    } else {
        return <Component {...pageProps} />
    }
}

export default appWithTranslation(MyApp);