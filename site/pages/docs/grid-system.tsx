import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ALink from '~/components/ALink';
import CssDoc from '~/layouts/CssDoc'

export default function HybridRendering({ t }: any) {
    return (
        <>
            <p>
                We devised a <b>hybrid architecture</b> that allows you to <b>pre-generate CSS from HTML</b> on the server
                side, and then continue to use <b>JIT</b> on the client side by reverse parsing.
            </p>
            <p>
                <a href="https://stackblitz.com/edit/mastercss-hybrid-rendering?file=pages%2Findex.tsx" target="blank">
                    Master CSS Hybrid Rendering for Next.js - StackBlitz
                </a>
            </p>
            <p>
                More to come... 🚧
            </p>
        </>
    )
}

const localeNamespace = 'docs.css.hybrid-rendering'

HybridRendering.page = {
    layout: CssDoc,
    title: 'Hybrid Rendering',
    description: 'We devised a hybrid architecture that allows you to pre-generate CSS from HTML on the server side, and then continue to use JIT on the client side by reverse parsing.',
    authors: ['Aron'],
    localeNamespace,
    type: 'article'
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
